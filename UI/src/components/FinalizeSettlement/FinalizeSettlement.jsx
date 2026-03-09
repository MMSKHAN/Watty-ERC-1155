import { NavLink } from "react-router-dom";
import SetFinalizeSettlement from "./SetFinalizeSettlement";
export default function FinalizeSettlement() {
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
      <NavLink to={"/get-finalize-settlement"} style={navStyle}>Get Finalize Settlements </NavLink>
    </div>
<SetFinalizeSettlement/>
    </div>
  );
}