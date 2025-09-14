import { useEffect, useState } from "react";

export default function Home() {
  const [numbers, setNumbers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [pending, setPending] = useState([]); // reservas hechas por este usuario (pendientes de confirmar)
  const price = 3000;
  const alias = "mi.alias.transferencia"; // ?? cambialo por tu alias real si querés

  const fetchNumbers = async () => {
    try {
      const res = await fetch("/api/numbers");
      const data = await res.json();
      setNumbers(data);
    } catch (err) {
      console.error("Error fetch numbers:", err);
    }
  };

  useEffect(() => {
    fetchNumbers();
    const interval = setInterval(fetchNumbers, 5000); // refresca cada 5s
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id, status) => {
    // solo se pueden seleccionar si están libres
    if (status !== "free") return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Reservar: manda a la API y guarda la lista en "pending"
  const reserveNumbers = async () => {
    if (selected.length === 0) {
      alert("No seleccionaste números para reservar.");
      return;
    }
    const idsToReserve = [...selected];
    try {
      await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve", ids: idsToReserve })
      });
      setPending(idsToReserve); // guardo lo que acabo de reservar
      setSelected([]); // desmarco la selección (ahora quedan como "reserved" en el tablero)
      fetchNumbers();
      alert("Reservados por 5 minutos. Hacé la transferencia y luego confirmá el pago.");
    } catch (err) {
      console.error(err);
      alert("Hubo un error al reservar. Intentá de nuevo.");
    }
  };

  // Confirmar pago: confirma las reservas que guardamos en "pending"
  const confirmNumbers = async () => {
    if (pending.length === 0) {
      alert("No hay reservas pendientes para confirmar.");
      return;
    }
    try {
      await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", ids: pending })
      });
      setPending([]);
      fetchNumbers();
      alert("Pago confirmado. Los números quedan marcados como vendidos.");
    } catch (err) {
      console.error(err);
      alert("Error al confirmar. Intentá de nuevo.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>??? Sorteo - 1000 Números</h1>
      <p style={{ textAlign: "center" }}>
        Precio: <b>${price}</b> cada número
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(20, 1fr)",
          gap: "4px",
          maxWidth: "1200px",
          margin: "20px auto"
        }}
      >
        {numbers.map(n => {
          // color por estado: free=verde, reserved=amarillo, sold=rojo
          const isSelected = selected.includes(n.id);
          const bg =
            n.status === "free"
              ? isSelected
                ? "#f1c40f" // amarillo cuando el usuario lo selecciona antes de reservar
                : "green"
              : n.status === "reserved"
              ? "yellow"
              : "red";
          return (
            <button
              key={n.id}
              onClick={() => toggleSelect(n.id, n.status)}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: n.status === "free" ? "pointer" : "not-allowed",
                background: bg
              }}
            >
              {n.id}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          padding: "15px",
          background: "#fff",
          borderRadius: