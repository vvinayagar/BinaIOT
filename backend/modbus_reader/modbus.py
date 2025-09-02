from pymodbus.client import ModbusTcpClient
import traceback

MODBUS_HOST = "127.0.0.1" # "192.168.1.20"
MODBUS_PORT = 1502 # 502
DEVICE_ID = 1
REGISTER_START = 125
REGISTER_COUNT = 4  # 2 regs per float32 -> 2 floats

last_values = {"float1": 0, "float2": 0, "raw": []}

def read_modbus():
    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT, timeout=1.0)
    try:
        # CONNECT
        try:
            if not client.connect():
                print("[Modbus] connect() returned False")
                return
        except Exception as e:
            print("[Modbus] connect() raised:", repr(e))
            traceback.print_exc()
            return

        print("Running 1")

        # READ
        try:
            rr = client.read_holding_registers(
                address=REGISTER_START, count=REGISTER_COUNT, device_id=DEVICE_ID
            )
        except Exception as e:
            print("[Modbus] read_holding_registers() raised:", repr(e))
            traceback.print_exc()
            return

        print("Running 2")

        if rr is None:
            print("[Modbus] read returned None")
            return

        if hasattr(rr, "isError") and rr.isError():
            # Best-effort details
            code = getattr(rr, "exception_code", None)
            print(f"[Modbus] device replied with error: {rr} (code={code})")
            return

        if not getattr(rr, "registers", None):
            print("[Modbus] no registers in response")
            return

        print("Running 3")

        # DECODE
        regs = rr.registers  # list[int], length == 4
        try:
            f1 = client.convert_from_registers(
                regs[0:2], data_type=client.DATATYPE.FLOAT32, word_order="big"
            )
            print("Running 4")

            f2 = client.convert_from_registers(
                regs[2:4], data_type=client.DATATYPE.FLOAT32, word_order="big"
            )
            print("Running 5")
        except Exception as e:
            print("[Modbus] decode error:", repr(e))
            traceback.print_exc()
            return

        # UPDATE LAST VALUES
        last_values["float1"] = f1
        last_values["float2"] = f2
        last_values["raw"] = regs

    except Exception as e:
        print("[Modbus] unexpected error:", repr(e))
        traceback.print_exc()
    finally:
        try:
            client.close()
        except Exception:
            pass
