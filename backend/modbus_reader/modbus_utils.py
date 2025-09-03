from pymodbus.client import ModbusTcpClient

def _write_register(client, address, value, slave_id):
    try:
        return client.write_register(address=address, value=value, unit=slave_id)
    except TypeError:
        return client.write_register(address=address, value=value, slave=slave_id)

def _read_registers(client, address, count, slave_id):
    try:
        return client.read_holding_registers(address=address, count=count, unit=slave_id)
    except TypeError:
        return client.read_holding_registers(address=address, count=count, slave=slave_id)

def write_zero_and_verify(host, port, slave_id, address, timeout=2):
    client = ModbusTcpClient(host, port=port, timeout=timeout)
    if not client.connect():
        return False, "connect_failed"

    try:
        wr = _write_register(client, address, 0, slave_id)
        if wr.isError():
            return False, f"write_error:{wr}"

        rr = _read_registers(client, address, 1, slave_id)
        if rr.isError():
            return True, {"wrote": 0, "verify": "read_error"}
        val = rr.registers[0] if rr.registers else None
        return True, {"wrote": 0, "readback": val}
    finally:
        client.close()
