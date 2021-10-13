import machine
import utime

def blink():
    for _ in range(10):
        machine.Pin(2).on()
        utime.sleep_ms(100)
        machine.Pin(2).off()
        utime.sleep_ms(100)