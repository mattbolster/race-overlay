from threading import Thread, Event, Lock
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

scraper_success_event = Event()
scraper_thread_lock = Lock()

def scrape_loop(url):
    global race_data, running, thread_running, current_browser

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            current_browser = browser
            page = browser.new_page()

            scraper_success_event.clear()

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                page.wait_for_selector('.datatable-row', timeout=15000)
                print("[SCRAPER] Selector found. Setting success event.")
                scraper_success_event.set()
            except Exception as page_err:
                print(f"[SCRAPER] Failed to load or select data: {page_err}")
                try:
                    page.screenshot(path="scraper_error.png")
                except:
                    pass
                thread_running = False
                running = False
                return

            thread_running = True
            running = True
            previous_data = []

            # ✅ Wait for frontend client to be ready before emitting anything
            waited = 0
            while not client_state['ready'] and waited < 10:
                print("[SCRAPER] Waiting for client to be ready...")
                time.sleep(0.5)
                waited += 0.5

            if not client_state['ready']:
                print("[SCRAPER] No client marked ready after 10s — will still proceed.")

            print("[SCRAPER] Scraping loop started...")
            first_emit = True

            while running:
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

                        new_data.append({
                            "position": int(get_text('.datatable-cell-position .position-cell span')),
                            "display_number": get_text('.datatable-cell-display-number .text-truncate'),
                            "competitor": get_text('.datatable-cell-competitor .text-truncate'),
                            "laps": get_text('.datatable-cell-laps .text-truncate'),
                            "last_lap": get_text('.datatable-cell-last-lap-time .text-truncate'),
                            "difference": get_text('.datatable-cell-difference .text-truncate'),
                            "gap": get_text('.datatable-cell-gap .text-truncate'),
                            "total_time": get_text('.datatable-cell-total-time .text-truncate'),
                            "best_lap": get_text('.datatable-cell-best-lap-time .text-truncate'),
                            "is_fastest_lap": 'purple' in classes,
                            "lap_progress": lap_progress
                        })

                    if new_data != previous_data:
                        race_data = copy.deepcopy(new_data)
                        previous_data = copy.deepcopy(new_data)
                        print(f"[SCRAPER] Updated with {len(new_data)} rows.")

                        if first_emit:
                            print("[SCRAPER] First emit — giving client a 2s buffer...")
                            time.sleep(2)
                            first_emit = False

                        try:
                            print("[SCRAPER] Emitting 'race_update':", race_data)
                            socketio.emit('race_update', {'data': race_data}, namespace='/')
                        except Exception as e:
                            print("[SCRAPER] Emit failed:", e)

                except Exception as loop_err:
                    print(f"[SCRAPER] Loop error: {loop_err}")
                    time.sleep(2)

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
    global thread_running, running, race_data, scraper_thread
    with scraper_thread_lock:
        race_data = []
        scraper_success_event.clear()

        if thread_running:
            print("[SCRAPER] Existing scraper running. Stopping it.")
            stop_scraper()
            if scraper_thread:
                scraper_thread.join()
                print("[SCRAPER] Previous thread joined.")

        running = True
        thread_running = False
        scraper_thread = socketio.start_background_task(scrape_loop, url)

        
    print("[SCRAPER] Scraper background task started.")
    return True
    

def stop_scraper():
    global running, scraper_thread
    if not running:
        print("[SCRAPER] Already stopped.")
        return
    running = False
    print("[SCRAPER] Stop flag set. Waiting...")
    if scraper_thread:
        scraper_thread.join()
        print("[SCRAPER] Scraper thread joined.")

def get_race_data():
    return race_data

def get_scraper_status():
    return {
        "scraper_running": thread_running
    }
