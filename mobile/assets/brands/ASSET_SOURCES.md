# TAMVA — Official Brand Asset Sources & Inventory

Inventory of all financial institution, telecom, utility, and merchant brand assets for the TAMVA platform.

---

## 1. Discovered, Verified & Active Assets

| Organization | Asset Filename | File Type | Source Website | Official Source? | Intended TAMVA Usage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GCB Bank PLC** | `assets/brands/financial/gcb-bank.png` | PNG (Transparent) | GCB Bank Official Site (`gcbbank.com.gh`) | Yes | Connected Accounts, Protection, Passport, Profile, Activity | **Verified & Active** |
| **Stanbic Bank Ghana** | `assets/brands/financial/Stanbic.png` | PNG | Standard Bank / Stanbic Official Brand Assets | Yes | Connected Accounts, Protection, Passport, Profile, Activity | **Verified & Active** |
| **CalBank PLC** | `assets/brands/financial/calbank.png` | PNG (Transparent) | CalBank Official Site (`calbank.net`) | Yes | Connected Accounts, Protection, Passport, Profile, Activity | **Verified & Active** |
| **Absa Bank Ghana** | `assets/brands/financial/absa.png` | PNG (Transparent) | Absa Bank Ghana Official (`absa.com.gh`) | Yes | Institution Catalog | **Verified & Active** |
| **Ecobank Ghana** | `assets/brands/financial/Ecobank.png` | PNG | Ecobank Official Brand Assets (`ecobank.com`) | Yes | Institution Catalog | **Verified & Active** |
| **MTN Mobile Money** | `assets/brands/telecom/mtn-mobile-money.png` | PNG (Transparent) & SVG | MTN MoMo Developer Portal (`momodeveloper.mtn.com`) | Yes | Connected Accounts, Protection, Passport, Profile, Activity | **Verified & Active** |
| **Telecel Cash** | `assets/brands/telecom/telecel-cash.png` | PNG (Transparent) | Telecel Group Official Site (`telecelgroup.com`) | Yes | Connected Accounts, Protection, Activity | **Verified & Active** |
| **Electricity Company of Ghana (ECG)** | `assets/brands/utilities/ecg.png` | PNG (Transparent) | Electricity Company of Ghana (`ecg.com.gh`) | Yes | Activity, Recent Activity | **Verified & Active** |
| **Ghana Water Company (GWCL)** | `assets/brands/utilities/GWCL.png` | PNG (Transparent) | Ghana Water Company Limited (`gwcl.com.gh`) | Yes | Activity / Transactions | **Verified & Active** |

---

## 2. Unmapped Catalog Providers (Graceful Fallback)

The following secondary institution uses TAMVA's graceful feather icon fallback:

| Organization | Target Local Path | Domain | Intended Usage | Fallback Icon |
| :--- | :--- | :--- | :--- | :--- |
| **Fidelity Bank Ghana** | `assets/brands/financial/fidelity-bank.png` | `fidelitybank.com.gh` | Institution Catalog | `credit-card` (surfaceElevated) |

---

## 3. Directory Layout

```text
assets/
  brands/
    ASSET_SOURCES.md
    financial/
      absa.png
      calbank.png
      Ecobank.png
      gcb-bank.png
      Stanbic.png
    telecom/
      mtn-mobile-money.png
      mtn-mobile-money.svg
      telecel-cash.png
    utilities/
      ecg.png
      GWCL.png
```
