import subprocess, os
os.chdir(r"C:\Users\Jose Alonso\IntelliJ_IDEA\work_manage_app")
r1 = subprocess.run(["git","add","docs/cuaderno.html","cuaderno.html","src/cuaderno.html"], capture_output=True, text=True)
print("ADD:", r1.returncode, r1.stdout, r1.stderr)
r2 = subprocess.run(["git","commit","-m","Fix: cuaderno de obra - dias independientes sin propagacion, valores por defecto residente y supervisor"], capture_output=True, text=True)
print("COMMIT:", r2.returncode, r2.stdout, r2.stderr)
r3 = subprocess.run(["git","push"], capture_output=True, text=True)
print("PUSH:", r3.returncode, r3.stdout, r3.stderr)

