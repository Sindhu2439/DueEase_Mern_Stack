import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../Navbar";
import socket from "../socket";
import { QRCodeCanvas } from "qrcode.react";
import API_BASE_URL from "../config";

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
        `${API_BASE_URL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      } else {
        toast.error(
          data.message || "Unable to load groups"
        );
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Unable to connect to server");
    }
  };

  // ==================== FETCH SETTLEMENTS ====================

  const fetchSettlements = async (groupId) => {
    if (!groupId) {
      setSettlements([]);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/group/${groupId}/settlements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSettlements(data.settlements || []);
      } else {
        setSettlements([]);
        toast.error(
          data.message || "Unable to load settlements"
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch settlements:",
        error
      );

      setSettlements([]);
      toast.error("Unable to connect to server");
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
        data.expense.group.toString() === selectedGroup
      ) {
        fetchSettlements(selectedGroup);
      }
    };

    const handleExpenseDeleted = (data) => {
      if (
        !data?.expense?.group ||
        data.expense.group.toString() === selectedGroup
      ) {
        if (selectedGroup) {
          fetchSettlements(selectedGroup);
        }
      }
    };

    const handleGroupUpdated = () => {
      fetchGroups();

      if (selectedGroup) {
        fetchSettlements(selectedGroup);
      }
    };

    socket.on("expenseAdded", handleExpenseAdded);
    socket.on("expenseDeleted", handleExpenseDeleted);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("expenseAdded", handleExpenseAdded);
      socket.off("expenseDeleted", handleExpenseDeleted);
      socket.off("groupUpdated", handleGroupUpdated);
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
      toast.error(
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

      <main className="page-container">

        {/* ==================== HEADER ==================== */}

        <div className="page-header settlement-page-header">
          <div>
            <span className="settlement-eyebrow">
              SMART DEBT MANAGEMENT
            </span>

            <h1>
              Settlement Plan
            </h1>

            <p>
              Simplified payments to settle all
              group expenses with minimum
              transactions.
            </p>
          </div>

          <div className="settlement-header-icon">
            ⇄
          </div>
        </div>

        {/* ==================== GROUP SELECT ==================== */}

        <section className="form-card settlement-selector-card">

          <div className="settlement-selector-heading">
            <div>
              <h2>
                Select Group
              </h2>

              <p>
                Choose a group to view its
                simplified payment plan.
              </p>
            </div>

            <span className="settlement-live-badge">
              ● Live
            </span>
          </div>

          <select
            value={selectedGroup}
            onChange={(e) =>
              setSelectedGroup(e.target.value)
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

        </section>

        {/* ==================== EMPTY BEFORE GROUP ==================== */}

        {!selectedGroup && (
          <section className="settlement-welcome">
            <div className="settlement-welcome-icon">
              ⇄
            </div>

            <h2>
              Simplify your group payments
            </h2>

            <p>
              Select a group above and DueEase
              will calculate who needs to pay
              whom with fewer transactions.
            </p>
          </section>
        )}

        {selectedGroup && (
          <>
            {/* ==================== SUMMARY ==================== */}

            <section className="settlement-summary">

              <div className="settlement-summary-card">
                <div className="settlement-summary-icon">
                  ⇄
                </div>

                <div>
                  <span>
                    Total Transactions
                  </span>

                  <h2>
                    {settlements.length}
                  </h2>

                  <small>
                    Payments required
                  </small>
                </div>
              </div>

              <div className="settlement-summary-card">
                <div className="settlement-summary-icon">
                  ₹
                </div>

                <div>
                  <span>
                    Total Settlement Amount
                  </span>

                  <h2>
                    ₹{totalAmount.toFixed(2)}
                  </h2>

                  <small>
                    Outstanding amount
                  </small>
                </div>
              </div>

              <div className="settlement-summary-card">
                <div className="settlement-summary-icon">
                  ✓
                </div>

                <div>
                  <span>
                    Settlement Method
                  </span>

                  <h2>
                    Minimum
                  </h2>

                  <small>
                    Fewer payment transactions
                  </small>
                </div>
              </div>

            </section>

            {/* ==================== LOADING ==================== */}

            {loading && (
              <section className="empty-state settlement-loading-state">
                <div className="settlement-loader">
                  ⟳
                </div>

                <h3>
                  Calculating settlement plan...
                </h3>

                <p>
                  DueEase is finding the simplest
                  way to settle the group expenses.
                </p>
              </section>
            )}

            {/* ==================== NO SETTLEMENTS ==================== */}

            {!loading &&
              settlements.length === 0 && (
                <section className="settlement-success-state">

                  <div className="settlement-success-icon">
                    ✓
                  </div>

                  <h2>
                    All Settled!
                  </h2>

                  <p>
                    There are currently no pending
                    payments for this group.
                  </p>

                </section>
              )}

            {/* ==================== SETTLEMENT LIST ==================== */}

            {!loading &&
              settlements.length > 0 && (
                <section className="balances-section settlement-list-section">

                  <div className="section-title">
                    <div>
                      <h2>
                        Who Pays Whom
                      </h2>

                      <p>
                        DueEase automatically
                        simplifies debts to reduce
                        unnecessary transactions.
                      </p>
                    </div>

                    <span className="member-count-badge">
                      {settlements.length}{" "}
                      {settlements.length === 1
                        ? "Payment"
                        : "Payments"}
                    </span>
                  </div>

                  <div className="settlement-list">

                    {settlements.map(
                      (settlement, index) => (
                        <div
                          className="settlement-card"
                          key={index}
                        >

                          {/* FROM */}

                          <div className="settlement-person">
                            <span className="settlement-person-label">
                              FROM
                            </span>

                            <div className="settlement-avatar settlement-avatar-from">
                              {settlement.fromEmail
                                ?.charAt(0)
                                .toUpperCase() ||
                                "U"}
                            </div>

                            <div>
                              <h3>
                                {settlement.fromEmail}
                              </h3>

                              <p>
                                Needs to pay
                              </p>
                            </div>
                          </div>

                          {/* ARROW */}

                          <div className="settlement-arrow">
                            →
                          </div>

                          {/* TO */}

                          <div className="settlement-person">
                            <span className="settlement-person-label">
                              TO
                            </span>

                            <div className="settlement-avatar settlement-avatar-to">
                              {settlement.toEmail
                                ?.charAt(0)
                                .toUpperCase() ||
                                "U"}
                            </div>

                            <div>
                              <h3>
                                {settlement.toEmail}
                              </h3>

                              <p>
                                Should receive
                              </p>

                              {settlement.upiId && (
                                <small>
                                  UPI:{" "}
                                  {settlement.upiId}
                                </small>
                              )}
                            </div>
                          </div>

                          {/* AMOUNT + PAYMENT */}

                          <div className="settlement-payment">

                            <div className="settlement-amount">
                              ₹
                              {Number(
                                settlement.amount
                              ).toFixed(2)}
                            </div>

                            {settlement.upiId ? (
                              <button
                                type="button"
                                className="settlement-pay-button"
                                onClick={() =>
                                  handleUPIPayment(
                                    settlement
                                  )
                                }
                              >
                                <span>₹</span>
                                Pay via UPI
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="settlement-pay-button settlement-pay-disabled"
                                disabled
                              >
                                UPI unavailable
                              </button>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </section>
              )}

            {/* ==================== HOW IT WORKS ==================== */}

            <section className="balance-info settlement-how-section">

              <div className="balance-info-header">
                <span className="balance-info-icon">
                  💡
                </span>

                <div>
                  <h2>
                    How settlement works
                  </h2>

                  <p>
                    DueEase uses debt simplification
                    to reduce unnecessary payments.
                  </p>
                </div>
              </div>

              <div className="settlement-steps">

                <div className="settlement-step">
                  <span>1</span>

                  <div>
                    <strong>
                      Calculate contributions
                    </strong>

                    <p>
                      DueEase calculates how much
                      each member has paid.
                    </p>
                  </div>
                </div>

                <div className="settlement-step">
                  <span>2</span>

                  <div>
                    <strong>
                      Find outstanding balances
                    </strong>

                    <p>
                      It identifies who owes money
                      and who should receive money.
                    </p>
                  </div>
                </div>

                <div className="settlement-step">
                  <span>3</span>

                  <div>
                    <strong>
                      Simplify the debts
                    </strong>

                    <p>
                      The algorithm matches debtors
                      with creditors.
                    </p>
                  </div>
                </div>

                <div className="settlement-step">
                  <span>4</span>

                  <div>
                    <strong>
                      Generate payment plan
                    </strong>

                    <p>
                      The result is a simplified
                      payment plan with fewer
                      transactions.
                    </p>
                  </div>
                </div>

                <div className="settlement-step">
                  <span>5</span>

                  <div>
                    <strong>
                      Pay using UPI
                    </strong>

                    <p>
                      Members can scan the QR code
                      to initiate the payment.
                    </p>
                  </div>
                </div>

              </div>

            </section>
          </>
        )}

      </main>

      {/* ==================== QR MODAL ==================== */}

      {showQR &&
        selectedSettlement && (
          <div
            className="settlement-qr-overlay"
            onClick={closeQR}
          >

            <div
              className="settlement-qr-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                type="button"
                className="settlement-qr-close"
                onClick={closeQR}
                aria-label="Close QR payment window"
              >
                ×
              </button>

              <div className="settlement-qr-icon">
                ₹
              </div>

              <h2>
                Scan to Pay
              </h2>

              <p className="settlement-qr-description">
                Pay{" "}
                <strong>
                  ₹
                  {Number(
                    selectedSettlement.amount
                  ).toFixed(2)}
                </strong>{" "}
                to
              </p>

              <h3>
                {selectedSettlement.toEmail}
              </h3>

              <div className="settlement-qr-container">
                <QRCodeCanvas
                  value={createUPILink(
                    selectedSettlement
                  )}
                  size={220}
                  level="H"
                />
              </div>

              <div className="settlement-qr-details">

                <span>
                  UPI ID
                </span>

                <strong>
                  {selectedSettlement.upiId}
                </strong>

              </div>

              <p className="settlement-qr-hint">
                Scan this QR code using a UPI
                app on your phone.
              </p>

              <button
                type="button"
                className="settlement-qr-close-button"
                onClick={closeQR}
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