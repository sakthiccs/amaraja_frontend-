const Header = () => {
  return (
    <div 
      className="flex justify-between items-center w-full px-6"
      style={{
        background: "#06121a",
        height: "100px",
        borderBottom: "1px solid #C6C6C6",
        color: "#ffffff",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 999
      }}
    >
      <div>
        <h1 className="text-lg font-bold">Amara Raja Circular Solutions Pvt Ltd</h1>
        <p className="text-sm text-gray-400">Energy Management System</p>
      </div>

      <div className="flex items-center gap-2">
        <div>
          <p className="text-xs text-gray-400">Last Updated</p>
          <p className="text-sm font-semibold">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
