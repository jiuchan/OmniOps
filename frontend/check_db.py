import sqlite3
import os

try:
    db = sqlite3.connect('../backend/omniops.db')
    cursor = db.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table[0]
        if 'ip' in table_name.lower():
            cursor.execute(f"SELECT * FROM {table_name}")
            print(f"--- Table: {table_name} ---")
            print(cursor.fetchall())
except Exception as e:
    print(e)
