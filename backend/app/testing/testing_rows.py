from playwright.sync_api import sync_playwright
import json

def scrape_all_data(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # For debugging
        page = browser.new_page()
        print(f"Loading page: {url}")
        page.goto(url, wait_until="domcontentloaded")
        
        page.wait_for_selector('.datatable-row', timeout=20000)
        print("Table loaded.")
        
        data = []
        rows = page.query_selector_all('.datatable-row')
        print(f"Found {len(rows)} rows.")

        for idx, row in enumerate(rows):
            classes = row.get_attribute('class') or ''
            if 'lap-progress' not in classes:
                continue
            
            def get_text(selector):
                elem = row.query_selector(selector)
                return elem.inner_text().strip() if elem else None

            racer_data = {
                "position": get_text('.datatable-cell-position .position-cell span'),
                "display_number": get_text('.datatable-cell-display-number .text-truncate'),
                "competitor": get_text('.datatable-cell-competitor .text-truncate'),
                "laps": get_text('.datatable-cell-laps .text-truncate'),
                "last_lap": get_text('.datatable-cell-last-lap-time .text-truncate'),
                "difference": get_text('.datatable-cell-difference .text-truncate'),
                "gap": get_text('.datatable-cell-gap .text-truncate'),
                "total_time": get_text('.datatable-cell-total-time .text-truncate'),
                "best_lap": get_text('.datatable-cell-best-lap-time .text-truncate'),
                "is_fastest_lap": 'purple' in classes
            }

            data.append(racer_data)

        browser.close()
        return data

# Example usage
url = 'https://speedhive.mylaps.com/livetiming/2F0D0083C1ECDBB6-2147485617/sessions/2F0D0083C1ECDBB6-2147485617-1073749655'
race_data = scrape_all_data(url)

# Print full data
print(json.dumps(race_data, indent=2))
