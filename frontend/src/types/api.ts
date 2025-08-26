export type HelloResponse = {
  message: string;
};

export type ModbusRegister = {
  address: number;
  value: number;
};

export type ModbusSnapshot = {
  unitId: number;
  timestamp: string; // ISO
  registers: ModbusRegister[];
};
