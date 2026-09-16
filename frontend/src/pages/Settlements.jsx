import { useEffect, useState } from "react";
import Navbar from "../Navbar";
import socket from "../socket";
import { QRCodeCanvas } from "qrcode.react";

function Settlements() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showQR, setShowQR] = useState(false);
    const [selectedSettlement, setSelectedSettlement] =
        useState(null);

    // ==================== FETCH GROUPS ====================

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/groups",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setGroups(data.groups || []);

                if (
                    data.groups?.length > 0 &&
                    !selectedGroup
                ) {
                    setSelectedGroup(data.groups[0]._id);
                }
            }
        } catch (error) {
            console.error(
                "Failed to fetch groups:",
                error
            );
        }
    };

    // ==================== FETCH SETTLEMENTS ====================

    const fetchSettlements = async (groupId) => {
        if (!groupId) return;

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/expenses/group/${groupId}/settlements`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSettlements(
                    data.settlements || []
                );
            } else {
                setSettlements([]);
            }
        } catch (error) {
            console.error(
                "Failed to fetch settlements:",
                error
            );

            setSettlements([]);
        } finally {
            setLoading(false);
        }
    };

    // ==================== SOCKET ====================

    useEffect(() => {
        fetchGroups();

        socket.connect();

        const handleExpenseAdded = (data) => {
            if (
                data?.expense?.group &&
                data.expense.group.toString() ===
                    selectedGroup
            ) {
                fetchSettlements(selectedGroup);
            }
        };

        const handleExpenseDeleted = () => {
            if (selectedGroup) {
                fetchSettlements(selectedGroup);
            }
        };

        const handleGroupUpdated = () => {
            fetchGroups();

            if (selectedGroup) {
                fetchSettlements(selectedGroup);
            }
        };

        socket.on(
            "expenseAdded",
            handleExpenseAdded
        );

        socket.on(
            "expenseDeleted",
            handleExpenseDeleted
        );

        socket.on(
            "groupUpdated",
            handleGroupUpdated
        );

        return () => {
            socket.off(
                "expenseAdded",
                handleExpenseAdded
            );

            socket.off(
                "expenseDeleted",
                handleExpenseDeleted
            );

            socket.off(
                "groupUpdated",
                handleGroupUpdated
            );

            socket.disconnect();
        };
    }, [selectedGroup]);

    // ==================== GROUP CHANGE ====================

    useEffect(() => {
        if (selectedGroup) {
            fetchSettlements(selectedGroup);
        }
    }, [selectedGroup]);

    // ==================== UPI QR PAYMENT ====================

    const createUPILink = (settlement) => {
        const amount = Number(
            settlement.amount
        ).toFixed(2);

        const receiverName =
            settlement.toEmail ||
            "DueEase Member";

        return (
            `upi://pay?pa=${encodeURIComponent(
                settlement.upiId
            )}` +
            `&pn=${encodeURIComponent(
                receiverName
            )}` +
            `&am=${amount}` +
            `&cu=INR`
        );
    };

    const handleUPIPayment = (settlement) => {
        if (!settlement.upiId) {
            alert(
                "The receiver has not added a UPI ID yet."
            );

            return;
        }

        setSelectedSettlement(settlement);
        setShowQR(true);
    };

    const closeQR = () => {
        setShowQR(false);
        setSelectedSettlement(null);
    };

    // ==================== TOTAL ====================

    const totalAmount = settlements.reduce(
        (total, settlement) =>
            total +
            Number(settlement.amount || 0),
        0
    );

    // ==================== UI ====================

    return (
        <div className="app">

            <Navbar />

            <div className="container">

                <div className="page-header">
                    <div>
                        <h1>
                            Settlement Plan
                        </h1>

                        <p>
                            Simplified payments to
                            settle all group expenses
                            with minimum transactions.
                        </p>
                    </div>
                </div>

                {/* ==================== GROUP SELECT ==================== */}

                <div className="card">

                    <label>
                        Select Group
                    </label>

                    <select
                        value={selectedGroup}
                        onChange={(e) =>
                            setSelectedGroup(
                                e.target.value
                            )
                        }
                    >
                        <option value="">
                            Select a group
                        </option>

                        {groups.map((group) => (
                            <option
                                key={group._id}
                                value={group._id}
                            >
                                {group.name}
                            </option>
                        ))}
                    </select>

                </div>

                {/* ==================== SUMMARY ==================== */}

                {selectedGroup && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "16px",
                            marginBottom: "24px"
                        }}
                    >

                        <div className="card">

                            <h3>
                                Total Transactions
                            </h3>

                            <h2>
                                {settlements.length}
                            </h2>

                        </div>

                        <div className="card">

                            <h3>
                                Total Settlement Amount
                            </h3>

                            <h2>
                                ₹
                                {totalAmount.toFixed(
                                    2
                                )}
                            </h2>

                        </div>

                        <div className="card">

                            <h3>
                                Settlement Method
                            </h3>

                            <h2>
                                Minimum
                            </h2>

                        </div>

                    </div>
                )}

                {/* ==================== LOADING ==================== */}

                {loading && (
                    <div className="card">

                        <p>
                            Loading settlement plan...
                        </p>

                    </div>
                )}

                {/* ==================== NO SETTLEMENTS ==================== */}

                {!loading &&
                    selectedGroup &&
                    settlements.length === 0 && (
                        <div className="card">

                            <h2>
                                All Settled 🎉
                            </h2>

                            <p>
                                There are currently no
                                pending payments for this
                                group.
                            </p>

                        </div>
                    )}

                {/* ==================== SETTLEMENT LIST ==================== */}

                {!loading &&
                    settlements.length > 0 && (
                        <div className="card">

                            <h2>
                                Who Pays Whom
                            </h2>

                            <p
                                style={{
                                    color: "#6b7280",
                                    marginBottom: "20px"
                                }}
                            >
                                DueEase automatically
                                simplifies debts to reduce
                                unnecessary transactions.
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection:
                                        "column",
                                    gap: "16px"
                                }}
                            >

                                {settlements.map(
                                    (
                                        settlement,
                                        index
                                    ) => (
                                        <div
                                            key={index}
                                            style={{
                                                border:
                                                    "1px solid #e5e7eb",
                                                borderRadius:
                                                    "12px",
                                                padding:
                                                    "18px",
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "space-between",
                                                gap: "16px",
                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >

                                            {/* FROM */}

                                            <div>

                                                <small
                                                    style={{
                                                        color:
                                                            "#6b7280"
                                                    }}
                                                >
                                                    FROM
                                                </small>

                                                <h3
                                                    style={{
                                                        margin:
                                                            "5px 0"
                                                    }}
                                                >
                                                    {
                                                        settlement.fromEmail
                                                    }
                                                </h3>

                                            </div>

                                            {/* ARROW */}

                                            <div
                                                style={{
                                                    fontSize:
                                                        "24px"
                                                }}
                                            >
                                                →
                                            </div>

                                            {/* TO */}

                                            <div>

                                                <small
                                                    style={{
                                                        color:
                                                            "#6b7280"
                                                    }}
                                                >
                                                    TO
                                                </small>

                                                <h3
                                                    style={{
                                                        margin:
                                                            "5px 0"
                                                    }}
                                                >
                                                    {
                                                        settlement.toEmail
                                                    }
                                                </h3>

                                                {settlement.upiId && (
                                                    <small
                                                        style={{
                                                            color:
                                                                "#6b7280"
                                                        }}
                                                    >
                                                        UPI:{" "}
                                                        {
                                                            settlement.upiId
                                                        }
                                                    </small>
                                                )}

                                            </div>

                                            {/* AMOUNT + BUTTON */}

                                            <div
                                                style={{
                                                    textAlign:
                                                        "right"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        fontSize:
                                                            "22px",
                                                        fontWeight:
                                                            "700",
                                                        marginBottom:
                                                            "10px"
                                                    }}
                                                >
                                                    ₹
                                                    {Number(
                                                        settlement.amount
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        handleUPIPayment(
                                                            settlement
                                                        )
                                                    }
                                                    disabled={
                                                        !settlement.upiId
                                                    }
                                                    style={{
                                                        border:
                                                            "none",
                                                        background:
                                                            settlement.upiId
                                                                ? "#4f46e5"
                                                                : "#9ca3af",
                                                        color:
                                                            "white",
                                                        padding:
                                                            "9px 16px",
                                                        borderRadius:
                                                            "8px",
                                                        cursor:
                                                            settlement.upiId
                                                                ? "pointer"
                                                                : "not-allowed",
                                                        fontWeight:
                                                            "600"
                                                    }}
                                                >
                                                    Pay via UPI
                                                </button>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    )}

                {/* ==================== HOW IT WORKS ==================== */}

                <div className="card">

                    <h2>
                        How settlement works
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: "12px"
                        }}
                    >

                        <p>
                            <strong>1.</strong>{" "}
                            DueEase calculates how much
                            each member has paid.
                        </p>

                        <p>
                            <strong>2.</strong>{" "}
                            It calculates who owes money
                            and who should receive money.
                        </p>

                        <p>
                            <strong>3.</strong>{" "}
                            The debt simplification
                            algorithm matches debtors
                            with creditors.
                        </p>

                        <p>
                            <strong>4.</strong>{" "}
                            The result is a simplified
                            payment plan with fewer
                            transactions.
                        </p>

                        <p>
                            <strong>5.</strong>{" "}
                            Members can scan the UPI QR
                            code to initiate the payment.
                        </p>

                    </div>

                </div>

            </div>

            {/* ==================== QR MODAL ==================== */}

            {showQR &&
                selectedSettlement && (

                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background:
                                "rgba(0, 0, 0, 0.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                "center",
                            zIndex: 1000
                        }}
                        onClick={closeQR}
                    >

                        <div
                            style={{
                                background:
                                    "white",
                                borderRadius:
                                    "16px",
                                padding:
                                    "30px",
                                width: "360px",
                                maxWidth: "90%",
                                textAlign:
                                    "center"
                            }}
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <h2>
                                Scan to Pay
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#6b7280"
                                }}
                            >
                                Pay ₹
                                {Number(
                                    selectedSettlement.amount
                                ).toFixed(
                                    2
                                )}{" "}
                                to
                            </p>

                            <h3>
                                {
                                    selectedSettlement.toEmail
                                }
                            </h3>

                            <div
                                style={{
                                    margin:
                                        "25px auto",
                                    display:
                                        "flex",
                                    justifyContent:
                                        "center"
                                }}
                            >

                                <QRCodeCanvas
                                    value={createUPILink(
                                        selectedSettlement
                                    )}
                                    size={220}
                                    level="H"
                                />

                            </div>

                            <p
                                style={{
                                    fontSize:
                                        "13px",
                                    color:
                                        "#6b7280"
                                }}
                            >
                                UPI ID:{" "}
                                {
                                    selectedSettlement.upiId
                                }
                            </p>

                            <p
                                style={{
                                    fontSize:
                                        "13px",
                                    color:
                                        "#6b7280",
                                    marginTop:
                                        "12px"
                                }}
                            >
                                Scan this QR code
                                using a UPI app on
                                your phone.
                            </p>

                            <button
                                onClick={closeQR}
                                style={{
                                    marginTop:
                                        "15px",
                                    border:
                                        "none",
                                    background:
                                        "#374151",
                                    color:
                                        "white",
                                    padding:
                                        "10px 20px",
                                    borderRadius:
                                        "8px",
                                    cursor:
                                        "pointer",
                                    fontWeight:
                                        "600"
                                }}
                            >
                                Close
                            </button>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default Settlements;