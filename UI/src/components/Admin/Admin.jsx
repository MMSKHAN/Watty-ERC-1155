import { NavLink } from "react-router-dom";
import { useWattyRead } from "../Hooks/UseWattyRead";
import RegisterMeter from "./RegisterMeter";

export default function Admin() {
  const {
    data: admin,
    isLoading,
    error,
    refetch,
  } = useWattyRead("admin");
const navStyle = {
  textDecoration: "none",
  padding: "8px 14px",
  background: "#111",
  color: "white",
  borderRadius: "6px",
  fontSize: "14px",
};
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      {isLoading && <p>Loading admin address...</p>}

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      {admin && (
  <div>
    {/* NAVIGATION */}
    <div
      style={{
        display: "flex",
        gap: "20px",
        marginBottom: "30px",
        padding: "12px 20px",
        background: "#f5f5f5",
        borderRadius: "8px",
      }}
    >

      <NavLink to="/get-meters" style={navStyle}>
        Meters
      </NavLink>

      <NavLink to="/add-minter" style={navStyle}>
        Add Minter
      </NavLink>

      <NavLink to="/get-minter" style={navStyle}>
        Get Minter
      </NavLink>
    </div>

    {/* ADMIN ADDRESS */}
    <div
      style={{
        padding: "15px",
        background: "#fafafa",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <strong>Admin:</strong>
      <div style={{ marginTop: "8px" }}>
        <code style={{ fontSize: "16px" }}>{admin}</code>
      </div>
    </div>
  </div>
)}

      <br />
<RegisterMeter/>
    </div>
  );
}