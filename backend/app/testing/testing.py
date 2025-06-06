from playwright.sync_api import sync_playwright, TimeoutError

def scrape_race_data(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Use headless=False to debug visually
        page = browser.new_page()
        print(f"Loading page: {url}")
        page.goto(url, wait_until="domcontentloaded")
        
        # Wait longer and for a more specific element (adjust selector as needed)
        import time

        timeout = 20  # seconds
        start = time.time()
        while time.time() - start < timeout:
            rows = page.query_selector_all('.datatable-row')
            if rows:
                print(f"Found {len(rows)} rows.")
                break
            print("Waiting for data...")
            time.sleep(1)
        else:
            print("Timeout: No rows found.")
            return []


        data = []
        rows = page.query_selector_all('.datatable-row')
        print(f"Found {len(rows)} rows.")
        for row in rows:
            classes = row.get_attribute('class') or ''
            if 'lap-progress' not in classes:
                continue  # Skip irrelevant rows
            
            pos_elem = row.query_selector('.datatable-cell-position')
            competitor_elem = row.query_selector('.datatable-cell-competition')
            last_lap_elem = row.query_selector('.datatable-cell-last-lap-time')
            
            if pos_elem and competitor_elem and last_lap_elem:
                pos = pos_elem.inner_text().strip()
                competitor = competitor_elem.inner_text().strip()
                last_lap = last_lap_elem.inner_text().strip()
                
                is_fastest = 'purple' in classes
                line = f"{pos} - {competitor} - Last Lap: {last_lap}"
                if is_fastest:
                    line += " [FASTEST LAP]"
                
                data.append(line)
        
        browser.close()
        return data

# Use the base live timing URL or specific session URL
url = 'https://speedhive.mylaps.com/livetiming/2F0D0083C1ECDBB6-2147485617/sessions/2F0D0083C1ECDBB6-2147485617-1073749655'
race_data = scrape_race_data(url)
for line in race_data:
    print(line)
