import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function WaiterDashBoard() {
    const [activeOrders, setActiveOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);

    // Modal State
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Selection State
    const [currentOrder, setCurrentOrder] = useState(null); // Đơn đang thao tác
    const [selectedRound, setSelectedRound] = useState(null); // Lần gọi đang xem
    const [cart, setCart] = useState({}); // Giỏ hàng: { item_id: quantity }

    // --- DUMMY DATA & MOCK API CALLS ---
    // 1. Load các đơn đang phục vụ (JOIN DONGOIMON, BAN, KHACHHANG)
    function loadActiveOrders() {
        const dummyOrders = [
            {
                id: 101, // ID_Don
                table_id: 5,
                customer_name: "Anh Nam",
                start_time: "2023-11-08T12:10:00Z",
                // Danh sách các lần gọi (Lấy từ LANGOIMON)
                rounds: [
                    { id: 501, time: "12:15", status: "Đã phục vụ" },
                    { id: 502, time: "12:30", status: "Đang xử lý" } // Mới gọi
                ]
            },
            {
                id: 102,
                table_id: 8,
                customer_name: "Chị Lan (Vãng lai)",
                start_time: "2023-11-08T12:25:00Z",
                rounds: [
                    { id: 505, time: "12:28", status: "Sẵn sàng phục vụ" }
                ]
            }
        ];
        setActiveOrders(dummyOrders);
    }

    // 2. Load Menu (Lấy từ MONAN where DangKinhDoanh=1)
    function loadMenu() {
    // API thực tế: GET /api/menu
        const dummyMenu = [
            { id: 1, name: "Phở Bò Đặc Biệt", price: 75000, category: "Mặn" },
            { id: 15, name: "Trà Đá", price: 5000, category: "Nước" },
            { id: 4, name: "Gỏi Cuốn", price: 15000, category: "Khai vị" },
            { id: 6, name: "Lẩu Thái", price: 250000, category: "Mặn" },
        ];
        setMenuItems(dummyMenu);
    }

    // 3. Load Chi tiết lần gọi (Lấy từ LANGOIMON_MON)
    async function loadRoundDetail(round) {
    // API thực tế: GET /api/waiter/round/${round.id}
    // Mock data trả về
        const details = [
            { item_name: "Phở Bò", quantity: 2, price: 75000, total: 150000 },
            { item_name: "Trà Đá", quantity: 1, price: 5000, total: 5000 }
        ];
    
        setSelectedRound({ ...round, items: details });
        setShowDetailModal(true);
    }

    useEffect(() => {
        loadActiveOrders();
    }, []);

    useEffect(() => {
        loadMenu();
    }, []);

    // Open Order
    const handleOpenOrder = (order) => {
        setCurrentOrder(order);
        setCart({});
        setShowMenuModal(true);
    }

    // Execute Ordering
    const handleQuantity = (itemID, delta) => {
        setCart(prev => {
            const newQty = (prev[itemID] || 0) + delta;
            if (newQty <= 0) {
                const { [itemID]: _, ...rest } = prev;
                return rest;
            }
            return  { ...prev, [itemID]: newQty };
        });
    }

    // Gửi gọi món xuống Backend (Gọi sp_TaoLanGoiMon -> Loop sp_ThemMonVaoLan)
    const handleSubmitOrder = async () => {
        if (Object.keys(cart).length === 0) return alert("Chưa chọn món nào!");
        
        const payload = {
        order_id: currentOrder.id,
        items: Object.entries(cart).map(([id, qty]) => ({
            item_id: parseInt(id),
            quantity: qty
        }))
        };

        console.log("Gửi xuống Backend:", payload);
        
        // Simulate API Call
        // await fetch('/api/waiter/order', { method: 'POST', body: JSON.stringify(payload) ... })
        
        alert("Đã gửi bếp thành công!");
        setShowMenuModal(false);
        loadActiveOrders(); // Reload lại để thấy Round mới
    };

    // Helper format tiền
    const fmtMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        
    
    return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>Phục Vụ Bàn</h2>

      {/* DANH SÁCH ĐƠN HÀNG (ACTIVE ORDERS) */}
      <div style={styles.gridContainer}>
        {activeOrders.map(order => (
          <div key={order.id} style={styles.orderCard}>
            {/* Header Card */}
            <div style={styles.cardHeader}>
              <div style={styles.tableBadge}>Bàn {order.table_id}</div>
              <div style={{fontSize: '12px', color: '#666'}}>
                {new Date(order.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>

            {/* Info Khách */}
            <div style={{marginBottom: '15px'}}>
              <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{order.customer_name}</div>
              <div style={{fontSize: '12px', color: '#888'}}>ID Đơn: #{order.id}</div>
            </div>

            {/* Danh sách các lần gọi (Rounds) */}
            <div style={styles.roundsContainer}>
              {order.rounds.map((round, idx) => (
                <button 
                  key={round.id} 
                  style={{
                    ...styles.roundChip, 
                    background: getStatusColor(round.status)
                  }}
                  onClick={() => loadRoundDetail(round)}
                >
                  Lần {idx + 1}
                </button>
              ))}
            </div>

            {/* Nút Gọi Món Mới */}
            <button 
              style={styles.addBtn}
              onClick={() => handleOpenOrder(order)}
            >
              + Gọi Thêm
            </button>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: MENU GỌI MÓN --- */}
      {showMenuModal && (
        <div style={styles.overlay} onClick={() => setShowMenuModal(false)}>
          <div style={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Gọi món - Bàn {currentOrder?.table_id}</h3>
              <button onClick={() => setShowMenuModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.menuGrid}>
              {menuItems.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <div key={item.id} style={styles.menuItem}>
                    <div style={{fontWeight: 'bold'}}>{item.name}</div>
                    <div style={{color: '#b3541e', fontSize: '13px'}}>{fmtMoney(item.price)}</div>
                    
                    <div style={styles.counterControl}>
                      <button 
                        style={styles.counterBtn} 
                        onClick={() => handleQuantity(item.id, -1)}
                        disabled={qty === 0}
                      >-</button>
                      <span style={{width: '20px', textAlign: 'center'}}>{qty}</span>
                      <button 
                        style={styles.counterBtn} 
                        onClick={() => handleQuantity(item.id, 1)}
                      >+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer: Tổng kết & Submit */}
            <div style={styles.modalFooter}>
              <div style={{fontWeight: 'bold'}}>
                Đã chọn: {Object.keys(cart).length} món
              </div>
              <button style={styles.submitBtn} onClick={handleSubmitOrder}>
                Gửi Bếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHI TIẾT LẦN GỌI --- */}
      {showDetailModal && selectedRound && (
        <div style={styles.overlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Chi tiết Lần gọi #{selectedRound.id}</h3>
              <button onClick={() => setShowDetailModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={{marginBottom: '15px', fontSize: '13px', color: '#555'}}>
              Trạng thái: <strong>{selectedRound.status}</strong> <br/>
              Thời gian: {selectedRound.time}
            </div>

            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #ddd', textAlign: 'left'}}>
                  <th style={{padding: '8px 0'}}>Món</th>
                  <th style={{padding: '8px 0', textAlign: 'center'}}>SL</th>
                  <th style={{padding: '8px 0', textAlign: 'right'}}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedRound.items?.map((item, idx) => (
                  <tr key={idx} style={{borderBottom: '1px dashed #eee'}}>
                    <td style={{padding: '8px 0'}}>{item.item_name}</td>
                    <td style={{padding: '8px 0', textAlign: 'center'}}>x{item.quantity}</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>{fmtMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// --- UTILS ---
function getStatusColor(status) {
    if (status === 'Đang xử lý') return '#ff9800'; // Cam
    if (status === 'Sẵn sàng phục vụ') return '#2196f3'; // Xanh dương
    if (status === 'Đã phục vụ') return '#4caf50'; // Xanh lá
    return '#9e9e9e';
}

// --- STYLES ---
const styles = {
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
    },
    orderCard: {
        background: "white",
        borderRadius: "12px",
        padding: "15px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid #eee",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
        borderBottom: "1px solid #f0f0f0",
        paddingBottom: "8px",
    },
    tableBadge: {
        background: "#5a381e",
        color: "white",
        padding: "4px 8px",
        borderRadius: "6px",
        fontWeight: "bold",
        fontSize: "14px",
    },
    roundsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "15px",
    },
    roundChip: {
        border: "none",
        color: "white",
        padding: "4px 10px",
        borderRadius: "15px",
        fontSize: "12px",
        cursor: "pointer",
        fontWeight: "500",
        transition: "opacity 0.2s",
    },
    addBtn: {
        width: "100%",
        padding: "10px",
        border: "1px dashed #b3541e",
        background: "#fff8f0",
        color: "#b3541e",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        marginTop: "auto",
    },
    // Modal Styles
    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        width: "400px",
        maxWidth: "90%",
        boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
    },
    modalLarge: {
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        width: "600px",
        maxWidth: "95%",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
    },
    modalHeader: {
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: "15px",
        borderBottom: "1px solid #eee",
        paddingBottom: "10px"
    },
    closeBtn: {
        background: "none", border: "none", fontSize: "20px", cursor: "pointer"
    },
    menuGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "10px",
        overflowY: "auto",
        flex: 1,
        paddingRight: "5px",
    },
    menuItem: {
        border: "1px solid #eee",
        borderRadius: "8px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100px",
    },
    counterControl: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "10px",
        background: "#f5f5f5",
        borderRadius: "4px",
        padding: "2px",
    },
    counterBtn: {
        width: "25px",
        height: "25px",
        border: "none",
        background: "white",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    },
    modalFooter: {
        marginTop: "15px",
        borderTop: "1px solid #eee",
        paddingTop: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    submitBtn: {
        padding: "10px 20px",
        background: "#b3541e",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: "pointer",
    }
};