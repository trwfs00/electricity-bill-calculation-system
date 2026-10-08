# MEA Residential Electricity Tariffs — checked 9 October 2026

The calculator implements ordinary Metropolitan Electricity Authority (MEA) residential categories 1.1 and 1.2. It does not apply PEA billing rules, TOU rates, special discounts, late charges, or carry-over balances. Verify the user's actual category and adjustments on their MEA bill.

## Current residential base rates

The tariff table is effective from the September 2026 bill. Energy charges are progressive by block and exclude Ft and VAT.

| Block | Category 1.1 | Category 1.2 |
| --- | ---: | ---: |
| Units 1–15 | 2.3488 baht/unit | — |
| Units 16–25 | 2.9882 baht/unit | — |
| Units 26–200 (or 1–200 for 1.2) | 3.0000 baht/unit | 3.0000 baht/unit |
| Units 201–400 | 4.1584 baht/unit | 4.1584 baht/unit |
| Above 400 | 4.3583 baht/unit | 4.3583 baht/unit |

Monthly service charges are 8.19 baht for 1.1 and 24.62 baht for 1.2, due even in a month with no consumption. The base energy rates exclude Ft and VAT.

The previous residential blocks, through the August 2026 bill, are:

- Category 1.1: units 1–15 at 2.3488; 16–25 at 2.9882; 26–35 at 3.2405; 36–100 at 3.6237; 101–150 at 3.7171; 151–400 at 4.2218; above 400 at 4.4217 baht/unit.
- Category 1.2: units 1–150 at 3.2484; 151–400 at 4.2218; above 400 at 4.4217 baht/unit.
- Monthly service charges remain 8.19 and 24.62 baht, respectively.

## Ft history and bill formula

MEA's official statistics list these Ft charges for the residential calculation:

| Billing period | Ft (baht/unit) |
| --- | ---: |
| September–December 2568 | 0.1572 |
| January–April 2569 | 0.0972 |
| May–August 2569 | 0.1623 |
| September–December 2569 | 0.1623 |

Calculate the base energy charge by applying each block to only the units in that block. Add the monthly service charge and (consumption × period Ft) to get the pre-VAT amount. Add 7% VAT to that amount. Apply any bill discount after VAT only when the bill shows it. The app's marginal appliance charge and roommate split are household allocation estimates; MEA bills the meter/account as a whole.

## Category selection and relief

Select the category printed on the bill. Category 1.1 assignment and subsequent changes depend on the service/meter conditions and usage history; one month's usage alone is insufficient to infer it. A meter above 5 A is assigned category 1.2. For a qualifying single-phase, two-wire, 230 V service with a meter not over 5 A, use above 150 units for three consecutive months changes the account to 1.2 the following month; use at or below 150 units for three consecutive months changes it back the following month. Confirm the actual category against the MEA bill.

Free electricity for category 1.1 is subject to the applicable eligibility rules and a monthly limit of 50 units. State-welfare relief additionally depends on the eligible customer being registered with MEA and consumption not exceeding 50 units for at least three consecutive months, including the current month. The calculator does not automatically grant either benefit; for accounts that receive relief, use the actual bill amount with the pro-rata method.

## Official MEA sources

- [MEA residential tariff table and category conditions](https://www.mea.or.th/our-services/service-rates/other/D5xEaEwgU)
- [MEA official tariff and billing FAQ PDF (September 2026)](https://www.mea.or.th/api/v1/dcproCMS/filesDownload/file_9fhcluns.pdf/5d185cb9-af10-4024-8288-46c6f3cbfc82)
- [MEA prior residential tariff PDF (before September 2026)](https://www.mea.or.th/api/v1/dcproCMS/filesDownload/file_obwn1bwg.pdf/bd1bd85a-cbfd-4fad-8dda-f0ce26713f85)
- [MEA Ft historical statistics](https://www.mea.or.th/our-services/service-rates/ft/statistics)
- [MEA electricity bill calculator and VAT formula](https://www.mea.or.th/our-services/mea-service/e-service/electric-monthly-calculate)
