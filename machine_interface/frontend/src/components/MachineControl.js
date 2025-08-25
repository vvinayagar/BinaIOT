import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MachineControl.css";

export default function MachineControl() {
  const [s, setS] = useState({
    auto_s1_speed: 15.0,
    auto_s1_acc: 150,
    auto_s1_dec: 150,
    auto_s1_single_step: 7.0,
    auto_s1_last_step: 106.0,
    no_of_roll_left: 4,
    no_of_roll_right: 4,
    product_count_pcs: 7784,
    product_count_set: 1356,
  });

  const [visible, setVisible] = useState(true);

  // --- API ---
  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/machine-settings/");
      if (Array.isArray(res.data) && res.data.length) setS(res.data[0]);
    } catch (e) {
      // keep defaults if API not up
    }
  };

  const savePartial = async (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    try {
      await axios.patch("/api/machine-settings/1/", patch);
    } catch (e) {
      /* ignore for UI demo */
    }
  };

  const resetPieces = async () => {
    try {
      const res = await axios.post("/api/machine-settings/reset-pcs/");
      setS((old) => ({ ...old, product_count_pcs: res.data.product_count_pcs ?? 0 }));
    } catch {
      setS((old) => ({ ...old, product_count_pcs: 0 }));
    }
  };

  const resetBundles = async () => {
    try {
      const res = await axios.post("/api/machine-settings/reset-set/");
      setS((old) => ({ ...old, product_count_set: res.data.product_count_set ?? 0 }));
    } catch {
      setS((old) => ({ ...old, product_count_set: 0 }));
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // numeric change helper (save on change to feel like PLC HMI)
  const onNum = (key) => (e) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    savePartial({ [key]: val });
  };

  if(!visible){
    return null;
  }

  return (
    <div className="hmi-viewport">
      <div className="hmi-panel">
        {/* top title bar with X */}
        <div className="hmi-titlebar">
          <span className="hmi-title">Auto Setting</span>
          <button className="hmi-x" onClick={() => setVisible(false)}> 
            <span>✖</span>
          </button>
        </div>

        <div className="hmi-inner-border">
          {/* Speed row with No of Roll on same line */}
          <div className="hmi-speed-row">
            <span className="hmi-speed-label">Auto S1 Speed :</span>
            <div className="hmi-input-wrap hmi-speed-input">
              <input
                className="hmi-input wide"
                type="number"
                step="0.1"
                value={s.auto_s1_speed}
                onChange={onNum("auto_s1_speed")}
              />
              <span className="hmi-unit">mm/s</span>
            </div>
            <div className="hmi-roll-section">
              <span className="hmi-roll-label">No of Roll :</span>
              <input
                className="hmi-input small"
                type="number"
                value={s.no_of_roll_left}
                onChange={onNum("no_of_roll_left")}
              />
              <input
                className="hmi-input small dark"
                type="number"
                value={s.no_of_roll_right}
                onChange={onNum("no_of_roll_right")}
              />
            </div>
          </div>

          {/* Regular rows */}
          <div className="hmi-row">
            <span className="hmi-label">Auto S1 Acc :</span>
            <input
              className="hmi-input"
              type="number"
              value={s.auto_s1_acc}
              onChange={onNum("auto_s1_acc")}
            />
          </div>

          <div className="hmi-row">
            <span className="hmi-label">Auto S1 Dec :</span>
            <input
              className="hmi-input"
              type="number"
              value={s.auto_s1_dec}
              onChange={onNum("auto_s1_dec")}
            />
          </div>

          <div className="hmi-row">
            <span className="hmi-label">Auto S1 Single Step mm :</span>
            <div className="hmi-input-wrap">
              <input
                className="hmi-input"
                type="number"
                step="0.1"
                value={s.auto_s1_single_step}
                onChange={onNum("auto_s1_single_step")}
              />
              <span className="hmi-unit">mm</span>
            </div>
          </div>

          <div className="hmi-row">
            <span className="hmi-label">Auto S1 Last Step mm :</span>
            <div className="hmi-input-wrap">
              <input
                className="hmi-input"
                type="number"
                step="0.1"
                value={s.auto_s1_last_step}
                onChange={onNum("auto_s1_last_step")}
              />
              <span className="hmi-unit">mm</span>
            </div>
          </div>

          {/* Product count rows with reset buttons */}
          <div className="hmi-product-row">
            <span className="hmi-product-label">Product Con (Psc) :</span>
            <input
              className="hmi-input narrow hmi-product-input"
              type="number"
              value={s.product_count_pcs}
              onChange={onNum("product_count_pcs")}
            />
            <button type="button" className="hmi-reset" onClick={resetPieces}>
              Reset
            </button>
          </div>

          <div className="hmi-product-row">
            <span className="hmi-product-label">Product Con (Set) :</span>
            <input
              className="hmi-input narrow hmi-product-input"
              type="number"
              value={s.product_count_set}
              onChange={onNum("product_count_set")}
            />
            <button type="button" className="hmi-reset" onClick={resetBundles}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}