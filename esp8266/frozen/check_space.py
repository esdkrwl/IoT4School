# Klasse, um sich den freien Speicherplatz/RAM anzeigen zu lassen
# Quelle: https://forum.micropython.org/viewtopic.php?t=3499

import gc
import os

# Funktion, die den freien Speicherplatz in MB anzeigt
def df():
  s = os.statvfs('//')
  return ('{0} MB'.format((s[0]*s[3])/1048576))

# Funktion, die den verfügbaren RAM anzeigt
def free(full=False):
  F = gc.mem_free()
  A = gc.mem_alloc()
  T = F+A
  P = '{0:.2f}%'.format(F/T*100)
  if not full: return P
  else : return ('Total:{0} Free:{1} ({2})'.format(T,F,P))