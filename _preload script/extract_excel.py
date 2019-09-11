#
# Dit script leest een excel naar een python dictionary
# Vervolgens schrijven we het weg naar een JSON om te
#

import pandas as pd
import pprint
import json

def main():

    # Display opties voor printen naar cmd.
    pd.options.display.width = 0
    pp = pprint.PrettyPrinter(indent=2)

    # Maak een lege dictionary waarin we de data gaan opslaan.
    n2k_dict = {}

    # Tabbladen excel worden ingelezen als dict. Key: dataframe
    sheets_dict = pd.read_excel("Opzet_n2k_intevullen.xlsx", sheet_name=None)

    # Loop door de sheets heen
    for name in sheets_dict:
        if name[0] == '_':
            print('Pagina {} wordt niet uitgelezen'.format(name))
            continue
        df = sheets_dict[name]
        n2k_dict[name] = extract_data(df)

    pp.pprint(n2k_dict)

    with open('n2k.json', 'wt') as file:
        file.write(json.dumps(n2k_dict, indent=2, sort_keys=True))

def extract_data(df):

    d = {}
    subd = {}

    for index, row in df.iloc[::-1].iterrows():
        s = row['subcat']
        c = row['cat']
        v = row['waarde']

        subcat = pd.notnull(s)
        cat = pd.notnull(c)
        val = pd.notnull(v)

        # Skip rij als er niets in staat.
        if not cat and not subcat and not val:
            continue

        # Voeg rij toe aan dict als er een cat :: value combi is
        if cat and not subcat and val:
            d[c] = v

        # Voeg key::value toe aan tijdelijke dict als er geen hoofdcat is
        # gedefinieerd.
        if not cat and subcat and val:
            subd[s] = v

        # Als er geen subcat of waarde is gedefinieerd, voeg dan de tijdelijke
        # dict toe aan de hoofd dict.
        if cat and not subcat and not val:
            # Als de key al bestaat
            if not d.get(c) and len(subd) > 0:
                d[c] = [subd]
                subd = {}

    return d

if __name__ == "__main__":
    main()