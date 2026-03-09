import { NavLink } from "react-router-dom";
import MintCredits from "./MintCredits";
export default function MintCreditsHome() {
const navStyle = {
  textDecoration: "none",
  padding: "8px 14px",
  background: "#111",
  color: "white",
  borderRadius: "6px",
  fontSize: "14px",
};
  return (
    
  <div>
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
      <NavLink to={"/get-credits"} style={navStyle}>Get Credits</NavLink>
      <NavLink to={"/transfer-credits"} style={navStyle}>Transfer Credits</NavLink>
    </div>
<MintCredits/>
    </div>
  );
}