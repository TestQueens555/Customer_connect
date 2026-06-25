"""
decode_reports.py
Run once: python decode_reports.py
Reads _fw_b64.txt and _db_b64.txt, decodes them to real .xlsx files,
then deletes itself and the temp txt files.
"""
import base64, os, datetime

today = datetime.date.today().strftime("%d-%b-%Y")

BASE   = r"D:\Claude\QA_Projects\CustomerConnect"
FW_TXT = os.path.join(BASE, r"Featurewise Test Report\_fw_b64.txt")
DB_TXT = os.path.join(BASE, r"Daily Bug Report\_db_b64.txt")
FW_OUT = os.path.join(BASE, r"Featurewise Test Report\Login.xlsx")
DB_OUT = os.path.join(BASE, f"Daily Bug Report\\BugReport_{today}.xlsx")

with open(FW_TXT) as f:
    with open(FW_OUT, "wb") as out:
        out.write(base64.b64decode(f.read().strip()))
print(f"Saved: {FW_OUT}")

with open(DB_TXT) as f:
    with open(DB_OUT, "wb") as out:
        out.write(base64.b64decode(f.read().strip()))
print(f"Saved: {DB_OUT}")

# Cleanup
for p in [FW_TXT, DB_TXT, __file__]:
    try: os.remove(p)
    except: pass

print("Done. Temp files cleaned up.")
