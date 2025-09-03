# simulator.py  — exact register pattern for your expected output
import asyncio
import struct
from datetime import datetime

from pymodbus.server import StartAsyncTcpServer
from pymodbus.datastore import (
    ModbusSequentialDataBlock,
    ModbusDeviceContext,
    ModbusServerContext,
)

HOST = "127.0.0.1"
PORT = 502
UNIT = 1  # not used when single=True
REG1_START = 125              # 4 regs (2 floats) -> [22848, 0, 1782, 0]
REG2_START = 428              # 10 regs (5 floats) -> [0,16752,250,0,250,0,0,16608,0,17108]

# ---- Exact raw registers to produce your expected result ----
BLOCK1_REGS = [22848, 0, 1782, 0]
BLOCK2_REGS = [0, 16752, 250, 0, 250, 0, 0, 16608, 0, 17108]

def f32_from_words_be(w1, w2) -> float:
    """for logging only: decode big-endian float from two 16-bit words"""
    return struct.unpack(">f", struct.pack(">HH", w1, w2))[0]

async def updater(device: ModbusDeviceContext):
    # Set once; keep server alive
    device.setValues(3, REG1_START, BLOCK1_REGS)  # FC3 holding regs
    device.setValues(3, REG2_START, BLOCK2_REGS)

    f1 = f32_from_words_be(BLOCK1_REGS[0], BLOCK1_REGS[1])
    f2 = f32_from_words_be(BLOCK1_REGS[2], BLOCK1_REGS[3])

    vals = []
    r2 = BLOCK2_REGS
    for i in range(0, len(r2), 2):
        vals.append(f32_from_words_be(r2[i], r2[i+1]))

    print(f"[{datetime.now():%H:%M:%S}] HR[{REG1_START}-{REG1_START+len(BLOCK1_REGS)-1}] <- {BLOCK1_REGS}  "
          f"(float1={f1}, float2={f2})")
    print(f"[{datetime.now():%H:%M:%S}] HR[{REG2_START}-{REG2_START+len(BLOCK2_REGS)-1}] <- {BLOCK2_REGS}")
    print("Expected JSON shape will be:")
    print({
        "float1": f1,
        "float2": f2,
        "values": [f1, f2] + vals,
        "raw": BLOCK1_REGS + BLOCK2_REGS
    })

    # keep the task alive
    while True:
        await asyncio.sleep(3600)

async def main():
    # Make sure HR size covers address 428..437 (=> need > 438 entries)
    device = ModbusDeviceContext(
        di=ModbusSequentialDataBlock(0, [0] * 100),
        co=ModbusSequentialDataBlock(0, [0] * 100),
        hr=ModbusSequentialDataBlock(0, [0] * 1000),  # plenty of space
        ir=ModbusSequentialDataBlock(0, [0] * 100),
    )
    context = ModbusServerContext(devices=device, single=True)

    server_task = asyncio.create_task(StartAsyncTcpServer(context=context, address=(HOST, PORT)))
    updater_task = asyncio.create_task(updater(device))
    try:
        await asyncio.gather(server_task, updater_task)
    except asyncio.CancelledError:
        pass

if __name__ == "__main__":
    asyncio.run(main())
