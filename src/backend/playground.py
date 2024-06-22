# -*- coding: utf-8 -*-
# @Author: Jason Y. Wu
# @Date:   2024-03-29 05:33:53
# @Last Modified by:   Jason Y. Wu
# @Last Modified time: 2024-03-29 06:20:45

import numpy as np

"""
SAMPLE COUNTRY  -   United States - USA

Sample Realm: USA/XXX      SAME VOTE: SA    DIFF(ABS): DA   DIFF(OPP): DO 
Assume there were 20 votes in total.      
    Australia       AUS     15              3               2
    Canada          CAN     17              2               1
    China           CHN     2               3               15
    Finland         FIN     11              2               7
    France          FRA     9               9               2
    Germany         DEU     12              4               4
    India           IND     11              6               3
    Iran            IRN     1               2               17
    Israel          ISR     18              1               1
    Japan           JPN     16              3               1
    North Korea     NKR     0               1               19
    Philippines     PHL     10              3               7
    Qatar           QTR     12              5               3
    Russia          RUS     4               4               12
    Saudi Arabia    SAU     9               3               8
    South Korea     KOR     14              5               1
    United Kingdom  GBR     19              1               0
    Venezuela       VEZ     3               3               14
"""


def calculate(data: list) -> list:
    results = []
    for country in data:
        countryID, SA, DA, DO = country[0], country[1], country[2], country[3]
        score = (SA + 0.5 * DA) / sum(country[1:])

        label = np.select(
            [
                score > 0.8,
                (score >= 0.6) & (score <= 0.8),
                (score >= 0.4) & (score < 0.6),
                (score >= 0.2) & (score < 0.4),
                score <= 0.2,
            ],
            ["Very Friendly", "Friendly", "Neutral", "Unfriendly", "Hostile"],
            np.nan,
        )
        # print(label)
        results.append((str(countryID), score, str(label)))

    return results


if __name__ == "__main__":
    data_usa = [
        # SV, DA, DO
        ["AUS", 15, 3, 2],  # AUS
        ["CAN", 17, 2, 1],  # CAN
        ["CHN", 2, 3, 15],  # CHN
        ["FIN", 11, 2, 7],  # FIN
        ["FRA", 9, 9, 2],  # FRA
        ["DEU", 12, 4, 4],  # DEU
        ["IND", 11, 6, 3],  # IND
        ["IRN", 1, 2, 17],  # IRN
        ["ISR", 18, 1, 1],  # ISR
        ["JPN", 16, 3, 1],  # JPN
        ["NKR", 0, 1, 19],  # NKR
        ["PHL", 10, 3, 7],  # PHL
        ["QTR", 12, 5, 3],  # QTR
        ["RUS", 4, 4, 12],  # RUS
        ["SAU", 9, 3, 8],  # SAU
        ["KOR", 14, 5, 1],  # KOR
        ["GBR", 19, 1, 0],  # GBR
        ["VEZ", 3, 3, 14],  # VEZ
    ]
    relations_usa = calculate(data_usa)
    for c in relations_usa:
        print(c)
