# /home/davin/Desktop/BinaIOT/backend/modbus_reader/modbus.py
from pymodbus.client import ModbusTcpClient
import traceback
import struct
from typing import List, Optional, Dict

# -------- CONFIG --------
MODBUS_HOST = "192.168.1.20"
MODBUS_PORT = 502
DEVICE_ID   = 1

# Block 1: 125..128 (4 regs -> 2 floats)
REG1_START, REG1_COUNT = 125, 4

# Block 2: 428..438 (10 regs -> 5 floats). If empty/zeros, also try 427..
REG2_START_PRIMARY  = 428
REG2_START_FALLBACK = 427
REG2_COUNT          = 10

# Decode options (adjust if numbers look swapped)
WORD_ORDER = "big"    # "big"  => high word first  (AB CD)
                      # "little" => low word first (CD AB)
BYTE_ORDER = "big"    # "big"  => each 16-bit word is big-endian (A,B)
                      # "little" => each 16-bit word is little-endian (B,A)

# Keeps your original keys + combined arrays
last_values: Dict[str, object] = {
    "float1": 0.0,
    "float2": 0.0,
    "values": [],   # all floats in read order
    "raw": []       # all raw registers in read order
}


# -------- HELPERS --------
def _read_holding(client: ModbusTcpClient, address: int, count: int, unit_id: int):
    """
    Cross-version wrapper for pymodbus read_holding_registers.
    Prefers device_id= (pymodbus >= 3.10, incl. 3.11.1), then falls back.
    """
    # 1) New name (3.10+)
    try:
        return client.read_holding_registers(address=address, count=count, device_id=unit_id)
    except TypeError:
        pass
    # 2) Legacy keyword names
    for kw in ("slave", "unit"):
        try:
            return client.read_holding_registers(address=address, count=count, **{kw: unit_id})
        except TypeError:
            continue
    # 3) Positional args variants
    try:
        return client.read_holding_registers(address, count, unit_id)
    except TypeError:
        pass
    # 4) Set client.unit_id if present, then call with (address, count)
    prev = getattr(client, "unit_id", None)
    try:
        if hasattr(client, "unit_id"):
            setattr(client, "unit_id", unit_id)
        return client.read_holding_registers(address, count)
    finally:
        if hasattr(client, "unit_id"):
            setattr(client, "unit_id", prev)


def _decode_float32_from_pair(reg_hi: int, reg_lo: int,
                              word_order: str = WORD_ORDER,
                              byte_order: str = BYTE_ORDER) -> Optional[float]:
    """
    Turn two 16-bit registers into one IEEE754 float32.
    Handles both word and byte orderings.
    """
    try:
        # Arrange the two 16-bit words according to word order
        if word_order.lower() == "big":
            words = (reg_hi, reg_lo)    # AB CD
        else:
            words = (reg_lo, reg_hi)    # CD AB

        # Turn words into bytes according to byte order
        def word_to_bytes(w: int) -> bytes:
            high = (w >> 8) & 0xFF
            low  = w & 0xFF
            return bytes([high, low]) if byte_order.lower() == "big" else bytes([low, high])

        b = word_to_bytes(words[0]) + word_to_bytes(words[1])
        # Interpret the arranged bytes as a big-endian float (we already arranged the bytes)
        return struct.unpack(">f", b)[0]
    except Exception:
        return None


def _regs_to_float_list(regs: List[int],
                        word_order: str = WORD_ORDER,
                        byte_order: str = BYTE_ORDER) -> List[float]:
    """Decode a flat register list into float32s (2 regs per float)."""
    out: List[float] = []
    for i in range(0, len(regs), 2):
        pair = regs[i:i+2]
        if len(pair) < 2:
            break
        f = _decode_float32_from_pair(pair[0], pair[1], word_order, byte_order)
        if f is None:
            # stop at first decode failure to avoid partial garbage
            break
        out.append(f)
    return out


# -------- PUBLIC API --------
def read_modbus() -> Optional[Dict[str, object]]:
    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT, timeout=1.0)
    try:
        if not client.connect():
            print("[Modbus] connect() returned False")
            return None

        combined_regs: List[int] = []
        combined_floats: List[float] = []

        # ===== Block 1: 125..128 =====
        try:
            rr1 = _read_holding(client, REG1_START, REG1_COUNT, DEVICE_ID)
        except Exception as e:
            print("[Modbus] read_holding_registers() raised (block1):", repr(e))
            traceback.print_exc()
            return None

        if rr1 is None:
            print("[Modbus] read returned None (block1)")
            return None
        if hasattr(rr1, "isError") and rr1.isError():
            code = getattr(rr1, "exception_code", None)
            print(f"[Modbus] device error (block1): {rr1} (code={code})")
            return None
        if not getattr(rr1, "registers", None):
            print("[Modbus] no registers in response (block1)")
            return None

        regs1 = rr1.registers  # len 4
        combined_regs.extend(regs1)

        floats1 = _regs_to_float_list(regs1)
        if len(floats1) < 2:
            print("[Modbus] decode produced fewer than 2 floats for block1")
            return None

        f1, f2 = floats1[0], floats1[1]
        combined_floats += [f1, f2]

        # ===== Block 2: 428..438 (fallback 427) =====
        def _read_block2(start_addr: int):
            try:
                return _read_holding(client, start_addr, REG2_COUNT, DEVICE_ID)
            except Exception as ex:
                print(f"[Modbus] read_holding_registers() raised (block2 @ {start_addr}):", repr(ex))
                traceback.print_exc()
                return None

        rr2 = _read_block2(REG2_START_PRIMARY)
        use_fallback = False

        if (rr2 is None or (hasattr(rr2, "isError") and rr2.isError())
            or not getattr(rr2, "registers", None)
            or all(v == 0 for v in rr2.registers)):
            use_fallback = True
            rr2 = _read_block2(REG2_START_FALLBACK)

        if rr2 and not (hasattr(rr2, "isError") and rr2.isError()) and getattr(rr2, "registers", None):
            regs2 = rr2.registers  # len 10
            combined_regs.extend(regs2)
            combined_floats += _regs_to_float_list(regs2)
        else:
            if use_fallback:
                print(f"[Modbus] block2 failed at {REG2_START_PRIMARY} and fallback {REG2_START_FALLBACK}")
            else:
                print(f"[Modbus] block2 failed at {REG2_START_PRIMARY}")

        # Update shared snapshot
        last_values["float1"] = f1
        last_values["float2"] = f2
        last_values["values"] = combined_floats
        last_values["raw"]    = combined_regs

        return last_values

    except Exception as e:
        print("[Modbus] unexpected error:", repr(e))
        traceback.print_exc()
        return None
    finally:
        try:
            client.close()
        except Exception:
            pass


def get_last_values() -> Dict[str, object]:
    """Simple accessor for Django views."""
    return last_values
