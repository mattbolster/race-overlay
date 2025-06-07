from threading import Thread, Lock
from playwright.sync_api import sync_playwright
import time
import copy
import re
from . import socketio
from .socketio_events import client_state

race_data = []
running = False
thread_running = False
current_browser = None
scraper_thread = None
scraper_thread_lock = Lock()

def scrape_loop(url):
    global race_data, running, thread_running, current_browser

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            current_browser = browser
            page = browser.new_page()

            try:
                print(f"[SCRAPER] Navigating to {url}")
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                page.wait_for_selector('.datatable-row', timeout=15000)
                print("[SCRAPER] Selector found.")
            except Exception as e:
                print(f"[SCRAPER] Page load error: {e}")
                try:
                    page.screenshot(path="scraper_error.png")
                    print("[SCRAPER] Screenshot saved.")
                except:
                    print("[SCRAPER] Screenshot failed.")
                return

            total_laps = 0
            try:
                header_elements = page.query_selector_all('div.header')
                for header in header_elements:
                    if header.inner_text().strip().lower() == 'laps':
                        value_div = header.evaluate_handle('node => node.nextElementSibling')
                        if value_div:
                            total_laps = int(value_div.inner_text().strip())
                            print(f"[SCRAPER] Parsed total laps: {total_laps}")
                            break
            except Exception as e:
                print(f"[SCRAPER] Lap parse error: {e}")

            thread_running = True
            running = True
            previous_data = []

            waited = 0
            while waited < 10:
                if client_state.get('ready'):
                    print("[SCRAPER] Client is ready ✅")
                    break
                time.sleep(0.1)
                waited += 0.1
            else:
                print("[SCRAPER] Client not ready — continuing anyway")

            print("[SCRAPER] Scraping loop starting...")
            first_emit = True
            unchanged_counter = 0

            while running:
                time.sleep(1)
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
                                el = row.query_selector(selector)
                                return el.inner_text().strip() if el else ''
                            except:
                                return ''

                        pos_text = get_text('.datatable-cell-position .position-cell span')
                        try:
                            position = int(pos_text)
                        except:
                            position = pos_text

                        laps_text = get_text('.datatable-cell-laps .text-truncate')
                        try:
                            laps = int(laps_text)
                        except:
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
                        race_data[:] = copy.deepcopy(new_data)
                        previous_data = copy.deepcopy(new_data)
                        unchanged_counter = 0
                        print(f"[SCRAPER] Emitting update with {len(new_data)} rows.")
                        if first_emit:
                            time.sleep(2)
                            first_emit = False
                        socketio.emit('race_update', race_data, namespace='/')
                    else:
                        unchanged_counter += 1
                        if unchanged_counter % 10 == 0:
                            print(f"[SCRAPER] Re-emitting unchanged data ({len(new_data)} rows).")
                            socketio.emit('race_update', race_data, namespace='/')

                except Exception as e:
                    print(f"[SCRAPER] Scrape error: {e}")
                    time.sleep(2)

    finally:
        if current_browser:
            try:
                current_browser.close()
            except:
                pass
        current_browser = None
        thread_running = False
        running = False
        print("[SCRAPER] Scraper thread exited.")

def start_scraper(url):
    global scraper_thread, race_data, running, thread_running
    with scraper_thread_lock:
        if thread_running:
            stop_scraper()

        race_data = []
        running = True
        thread_running = False
        scraper_thread = Thread(target=scrape_loop, args=(url,))
        scraper_thread.start()
        print("[SCRAPER] Scraper thread started.")

def stop_scraper():
    global running, scraper_thread
    with scraper_thread_lock:
        if not running:
            print("[SCRAPER] Already stopped.")
            return

        running = False
        print("[SCRAPER] Stop requested.")
        scraper_thread = None

def get_race_data():
    return race_data

def get_scraper_status():
    return {"scraper_running": thread_running}
