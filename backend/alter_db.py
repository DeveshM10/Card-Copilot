import sqlite3

def alter():
    conn = sqlite3.connect('cardpilot.db')
    cursor = conn.cursor()
    columns = [
        "age_group", "income_range", "online_shopping_spend",
        "high_freq_categories", "financial_goals", "risk_attitude",
        "investment_goals", "has_external_income", "external_income_sources"
    ]
    for col in columns:
        try:
            cursor.execute(f'ALTER TABLE users ADD COLUMN {col} VARCHAR DEFAULT ""')
            print(f"Added {col}")
        except sqlite3.OperationalError as e:
            print(f"Skipped {col}: {e}")
    conn.commit()
    conn.close()

if __name__ == '__main__':
    alter()
