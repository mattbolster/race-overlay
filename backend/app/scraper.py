from eventlet.semaphore import Semaphore as Lock
import eventlet
from playwright.sync_api import sync_playwright
import copy
import re
from . import socketio
from .socketio_events import client_state

race_data = []
running = False
thread_running = False
current_browser = None
scraper_task = None
scraper_thread_lock = Lock()

def scrape_loop(url):
    global race_data, running, thread_running, current_browser

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            current_browser = browser
            page = browser.new_page()

            try:
                print(f"[SCRAPER] Navigating to URL: {url}")
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                print("[SCRAPER] Waiting for selector '.datatable-row'...")
                page.wait_for_selector('.datatable-row', timeout=15000)
                print("[SCRAPER] Selector found.")
            except Exception as page_err:
                print(f"[SCRAPER] Failed to load or select data: {page_err}")
                try:
                    page.screenshot(path="scraper_error.png")
                    print("[SCRAPER] Saved screenshot to scraper_error.png")
                except Exception as ss_err:
                    print(f"[SCRAPER] Screenshot failed: {ss_err}")
                thread_running = False
                running = False
                return

            # ✅ Scrape total laps from the "laps" header value
            total_laps = 0
            try:
                header_elements = page.query_selector_all('div.header')
                for header in header_elements:
                    if header.inner_text().strip().lower() == 'laps':
                        value_div = header.evaluate_handle('node => node.nextElementSibling')
                        if value_div:
                            total_laps_text = value_div.inner_text().strip()
                            total_laps = int(total_laps_text)
                            print(f"[SCRAPER] Total laps parsed: {total_laps}")
                            break
            except Exception as lap_err:
                print(f"[SCRAPER] Failed to scrape total laps: {lap_err}")
                total_laps = 0

            thread_running = True
            running = True
            previous_data = []

            waited = 0
            max_wait = 10
            print("[SCRAPER] Waiting up to 10s for client to be ready...")
            while waited < max_wait:
                if client_state.get('ready'):
                    print("[SCRAPER] Client marked ready ✅")
                    break
                eventlet.sleep(0.1)
                waited += 0.1
                if int(waited * 10) % 10 == 0:
                    print(f"[SCRAPER] Still waiting... {waited:.1f}s")

            if not client_state.get('ready'):
                print("[SCRAPER] Client not marked ready — continuing anyway.")

            print("[SCRAPER] Scraping loop started...")
            first_emit = True

            while running:
                eventlet.sleep(1)
                if not running:
                    break
                try:
                    rows = page.query_selector_all('.datatable-row')
                    new_data = []

                    for row in rows:
                        classes = row.get_attribute('class') or ''
                        if 'lap-progress' not in classes:
                            continue

                        style_attr = row.get_attribute('style') or ''
                        progress_match = re.search(r'--[a-z0-9]+:\s*([\d.]+)%', style_attr)
                        lap_progress = float(progress_match.group(1)) if progress_match else None

                        def get_text(selector):
                            try:
                                e = row.query_selector(selector)
                                return e.inner_text().strip() if e else ''
                            except Exception as err:
                                print(f"[SCRAPER] Error getting selector '{selector}': {err}")
                                return ''

                        pos_text = get_text('.datatable-cell-position .position-cell span')
                        try:
                            position = int(pos_text)
                        except ValueError:
                            position = pos_text

                        laps_text = get_text('.datatable-cell-laps .text-truncate')
                        try:
                            laps = int(laps_text)
                        except ValueError:
                            laps = 0

                        has_finished = total_laps > 0 and laps >= total_laps

                        new_data.append({
                            "position": position,
                            "display_number": get_text('.datatable-cell-display-number .text-truncate'),
                            "competitor": get_text('.datatable-cell-competitor .text-truncate'),
                            "laps": laps,
                            "last_lap": get_text('.datatable-cell-last-lap-time .text-truncate'),
                            "difference": get_text('.datatable-cell-difference .text-truncate'),
                            "gap": get_text('.datatable-cell-gap .text-truncate'),
                            "total_time": get_text('.datatable-cell-total-time .text-truncate'),
                            "best_lap": get_text('.datatable-cell-best-lap-time .text-truncate'),
                            "is_fastest_lap": 'purple' in classes,
                            "lap_progress": lap_progress,
                            "has_finished": has_finished
                        })

                    if new_data != previous_data:
                        race_data = copy.deepcopy(new_data)
                        previous_data = copy.deepcopy(new_data)
                        print(f"[SCRAPER] Updated with {len(new_data)} rows.")

                        if first_emit:
                            print("[SCRAPER] First emit — giving client a 2s buffer...")
                            eventlet.sleep(2)
                            first_emit = False

                        try:
                            socketio.emit('race_update', race_data, namespace='/')
                            print("[SCRAPER] Emit successful.")
                        except Exception as e:
                            print("[SCRAPER] Emit failed:", e)

                except Exception as loop_err:
                    print(f"[SCRAPER] Loop error: {loop_err}")
                    eventlet.sleep(2)

    except Exception as outer_err:
        print(f"[SCRAPER] Setup crashed: {outer_err}")

    finally:
        try:
            if current_browser:
                print("[SCRAPER] Closing browser...")
                current_browser.close()
        except Exception as close_err:
            print(f"[SCRAPER] Error closing browser: {close_err}")
        finally:
            thread_running = False
            current_browser = None
            running = False
            print("[SCRAPER] Scraping thread exited.")


def start_scraper(url):
    global thread_running, running, race_data, scraper_task
    with scraper_thread_lock:
        race_data = []
        if thread_running:
            print("[SCRAPER] Existing scraper running. Stopping it.")
            stop_scraper()

        running = True
        thread_running = False
        scraper_task = socketio.start_background_task(scrape_loop, url)
        print("[SCRAPER] Scraper background task started.")


def stop_scraper():
    global scraper_task, running
    with scraper_thread_lock:
        if not running:
            print("[SCRAPER] Already stopped.")
            return

        running = False
        print("[SCRAPER] Stop flag set. Waiting for greenlet to exit...")

        if scraper_task:
            try:
                scraper_task.join(timeout=3)
                print("[SCRAPER] Greenlet finished cleanly.")
            except eventlet.timeout.Timeout:
                print("[SCRAPER] Timeout. Forcing kill.")
                try:
                    scraper_task.kill()
                    print("[SCRAPER] Greenlet killed.")
                except Exception as e:
                    print(f"[SCRAPER] Kill failed: {e}")
            finally:
                scraper_task = None


def get_race_data():
    return race_data


def get_scraper_status():
    return {
        "scraper_running": thread_running
    }
