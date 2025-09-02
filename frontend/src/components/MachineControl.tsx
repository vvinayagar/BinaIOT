// src/components/MachineControl.tsx
import React, { useEffect, useState } from "react";
import "./MachineControl.css";
import { Col, Container, Row } from "react-bootstrap";

type ModbusStatus = {
  float1: number | null;
  float2: number | null;
  raw: number[];
};

// Keep your existing shape for demo defaults (inputs stay rendered)
type MachineSettings = {
  auto_s1_speed: number | string;
  auto_s1_acc: number | string;
  auto_s1_dec: number | string;
  auto_s1_single_step: number | string;
  auto_s1_last_step: number | string;
  no_of_roll_left: number | string;
  no_of_roll_right: number | string;
  product_count_pcs: number | string;
  product_count_set: number | string;
};

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function MachineControl() {
  // Demo defaults (we won’t save these anywhere)
  const [s, setS] = useState<MachineSettings>({
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

  const [m, setM] = useState<ModbusStatus | null>(null);
  const [visible, setVisible] = useState(true);

  // ---- Poll /status/ every 1s ----
  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let ac: AbortController | null = null;

    const tick = async () => {
      ac?.abort();
      ac = new AbortController();
      try {
        const res = await fetch(`${API}/status/`, { signal: ac.signal, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as ModbusStatus;
        if (!stopped) setM(json);
      } catch {
        // ignore transient errors for demo
      }
    };

    tick(); // immediate
    timer = window.setInterval(tick, 1000);

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      ac?.abort();
    };
  }, []);

  // numeric change helper for demo-only local edits
  const onNum =
    (key: keyof MachineSettings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === "" ? "" : Number(e.target.value);
        setS((old) => ({ ...old, [key]: val }));
      };

  if (!visible) return <></>;

  // For the demo: show float1 inside Auto S1 Speed, float2 beside it.
  const speedValue = m?.float1 ?? s.auto_s1_speed;

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
          <Container>
            {/* Live values strip from /status/ */}
            {/* <Row className="mb-2 mt-3">
              <Col md={6}>
                <div className="d-flex align-items-center gap-2">
                  <span className="hmi-label">Live Float1:</span>
                  <span className="hmi-value">
                    {m?.float1 == null ? "—" : m.float1.toFixed(2)}
                  </span>
                  <span className="hmi-unit">mm/s</span>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-center gap-2">
                  <span className="hmi-label">Live Float2:</span>
                  <span className="hmi-value">
                    {m?.float2 == null ? "—" : m.float2.toFixed(2)}
                  </span>
                </div>
              </Col>
              <Col md={12}>
                <div className="text-muted small">raw: [{m?.raw?.join(", ") ?? ""}]</div>
              </Col>
            </Row> */}

            {/* Speed row with No of Roll on same line */}
            <Row className="mt-3">
              <Col md={6}>
                <Row>
                  <Col>
                    <span className="hmi-speed-label">Auto S1 Speed :</span>
                  </Col>
                  <Col>
                    {/* Mirror float1 into this field for demo */}
                    <input
                      className="form-control hmi-input"
                      type="number"
                      step="0.1"
                      value={speedValue}
                      onChange={onNum("auto_s1_speed")}
                    />
                    <span className="hmi-unit">mm/s</span>
                    <div className="small text-muted">
                      (live from /status/: {m?.float1 == null ? "—" : m.float1.toFixed(2)})
                    </div>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row className="mt-3 m-sm-0">
                  <Col>
                    <span className="hmi-roll-label">No of Roll :</span>
                  </Col>
                  <Col>
                    <input
                      className="form-control hmi-input small"
                      type="number"
                      value={s.no_of_roll_left}
                      onChange={onNum("no_of_roll_left")}
                    />
                  </Col>
                  <Col>
                    <input
                      className="form-control hmi-input small dark"
                      type="number"
                      value={s.no_of_roll_right}
                      onChange={onNum("no_of_roll_right")}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Regular rows (unchanged demo inputs) */}
            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-label">Auto S1 Acc :</span>
              </Col>
              <Col>
                <input
                  className="form-control hmi-input"
                  type="number"
                  value={s.auto_s1_acc}
                  onChange={onNum("auto_s1_acc")}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-label">Auto S1 Dec :</span>
              </Col>
              <Col>
                <input
                  className="form-control hmi-input"
                  type="number"
                  value={s.auto_s1_dec}
                  onChange={onNum("auto_s1_dec")}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-label">Auto S1 Single Step mm :</span>
              </Col>
              <Col>
                <input
                  className="form-control hmi-input"
                  type="number"
                  step="0.1"
                  value={s.auto_s1_single_step}
                  onChange={onNum("auto_s1_single_step")}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-label">Auto S1 Last Step mm :</span>
              </Col>
              <Col>
                <input
                  className="form-control hmi-input"
                  type="number"
                  step="0.1"
                  value={s.auto_s1_last_step}
                  onChange={onNum("auto_s1_last_step")}
                />
                <span className="hmi-unit">mm</span>
              </Col>
            </Row>

            {/* Product count rows with reset buttons (local-only demo) */}
            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-label">Product Con (Psc):</span>
              </Col>
              <Col>
                <Row>
                  <Col lg={9} md={9}>
                    <input
                      className="form-control hmi-input narrow hmi-product-input"
                      type="number"
                      value={m?.raw?.[0] ?? s.product_count_pcs}
                      onChange={onNum("product_count_pcs")}
                    />
                  </Col>
                  <Col className="mt-3 m-sm-0" lg={3} md={3} sm={12}>
                    <button
                      type="button"
                      className="btn btn-primary hmi-reset"
                      onClick={() => setS((o) => ({ ...o, product_count_pcs: 0 }))}
                    >
                      Reset
                    </button>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col lg={3} md={3}>
                <span className="hmi-product-label">Product Con (Set) :</span>
              </Col>
              <Col>
                <Row>
                  <Col lg={9} md={9}>
                    <input
                      className="form-control hmi-input narrow hmi-product-input"
                      type="number"
                      value={m?.raw?.[2] ?? s.product_count_pcs}

                      onChange={onNum("product_count_set")}
                    />
                  </Col>
                  <Col className="mt-3 m-sm-0" lg={3} md={3} sm={12}>
                    <button
                      type="button"
                      className="btn btn-primary hmi-reset"
                      onClick={() => setS((o) => ({ ...o, product_count_set: 0 }))}
                    >
                      Reset
                    </button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
}
