import urllib.request, json

url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data/observaciones_manuales.json'
r = urllib.request.urlopen(url)
d = r.read().decode('utf-8')
with open('_obs_result.txt', 'w', encoding='utf-8') as f:
    f.write('observaciones_manuales: ' + d + '\n')

url2 = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data/actividades_manuales.json'
r2 = urllib.request.urlopen(url2)
d2 = r2.read().decode('utf-8')
with open('_obs_result.txt', 'a', encoding='utf-8') as f:
    f.write('actividades_manuales: ' + d2 + '\n')

print('Done')

