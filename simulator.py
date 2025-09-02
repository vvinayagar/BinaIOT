# simulator.py  (fixed)
import asyncio, random, struct
from datetime import datetime

from pymodbus.server import StartAsyncTcpServer
from pymodbus.datastore import (
    ModbusSequentialDataBlock,
    ModbusDeviceContext,
    ModbusServerContext,
)

HOST = "127.0.0.1"
PORT = 1502
UNIT = 1
REG_START = 125

def f32_to_words(val: float, byteorder: str = "big") -> tuple[int, int]:
    if byteorder == "big":
        b = struct.pack(">f", val)
        return struct.unpack(">HH", b)
    b = struct.pack("<f", val)
    return struct.unpack("<HH", b)

async def updater(device: ModbusDeviceContext):
    while True:
        f1 = 20.0 + 5.0 * random.random()
        f2 = 70.0 + 3.0 * random.random()
        regs = [*f32_to_words(f1, "big"), *f32_to_words(f2, "big")]
        device.setValues(3, REG_START, regs)  # FC3 holding regs
        print(f"[{datetime.now():%H:%M:%S}] HR[{REG_START}-{REG_START+3}] <- {regs}  (f1={f1:.2f}, f2={f2:.2f})")
        await asyncio.sleep(1.0)

async def main():
    device = ModbusDeviceContext(
        di=ModbusSequentialDataBlock(0, [0] * 100),
        co=ModbusSequentialDataBlock(0, [0] * 100),
        hr=ModbusSequentialDataBlock(0, [0] * 300),
        ir=ModbusSequentialDataBlock(0, [0] * 100),
    )

    # 👇 pass the device object directly (single=True by default)
    context = ModbusServerContext(devices=device, single=True)

    server_task = asyncio.create_task(StartAsyncTcpServer(context=context, address=(HOST, PORT)))
    updater_task = asyncio.create_task(updater(device))
    try:
        await asyncio.gather(server_task, updater_task)
    except asyncio.CancelledError:
        pass

if __name__ == "__main__":
    asyncio.run(main())
