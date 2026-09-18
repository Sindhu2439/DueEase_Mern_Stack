import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../Navbar";
import socket from "../socket";
import API_BASE_URL from "../config";

function Balances() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setGroups(data.groups || data);
      } else {
        toast.error(data.message || "Unable to load groups");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server");
    }
  };

  const fetchBalances = async (groupId) => {
    if (!groupId) {
      setBalances([]);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/group/${groupId}/balances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBalances(data.balances || []);
      } else {
        toast.error(
          data.message || "Unable to calculate balances"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    socket.connect();

    const handleExpenseAdded = (data) => {
      if (
        data?.expense?.group &&
        data.expense.group.toString() === selectedGroup
      ) {
        fetchBalances(selectedGroup);
      }
    };

    const handleExpenseDeleted = (data) => {
      if (
        !data?.expense?.group ||
        data.expense.group.toString() === selectedGroup
      ) {
        if (selectedGroup) {
          fetchBalances(selectedGroup);
        }
      }
    };

    const handleGroupUpdated = () => {
      fetchGroups();

      if (selectedGroup) {
        fetchBalances(selectedGroup);
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

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    fetchBalances(groupId);
  };

  const totalReceivable = balances
    .filter((person) => Number(person.balance) > 0.01)
    .reduce(
      (total, person) =>
        total + Number(person.balance),
      0
    );

  const totalPayable = balances
    .filter((person) => Number(person.balance) < -0.01)
    .reduce(
      (total, person) =>
        total + Math.abs(Number(person.balance)),
      0
    );

  const settledCount = balances.filter(
    (person) =>
      Math.abs(Number(person.balance)) <= 0.01
  ).length;

  const getBalanceStatus = (balance) => {
    const value = Number(balance);

    if (value > 0.01) {
      return "receive";
    }

    if (value < -0.01) {
      return "pay";
    }

    return "settled";
  };

  return (
    <div>
      <Navbar />

      <main className="page-container">

        <div className="page-header">
          <h1>Balances</h1>

          <p>
            See who owes money and who should receive
            money in your group.
          </p>
        </div>

        {/* Group Selection */}

        <section className="form-card balance-selector-card">
          <div className="section-title">
            <div>
              <h2>Select Group</h2>

              <p>
                Choose a group to calculate the latest
                balances.
              </p>
            </div>

            <span className="balance-live-badge">
              ● Live
            </span>
          </div>

          <select
            value={selectedGroup}
            onChange={handleGroupChange}
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

        {!selectedGroup && (
          <section className="balance-welcome">
            <div className="balance-welcome-icon">
              💰
            </div>

            <h2>
              Track your group balances
            </h2>

            <p>
              Select a group above to see who needs
              to pay and who should receive money.
            </p>
          </section>
        )}

        {selectedGroup && (
          <>
            {/* Summary */}

            <section className="balance-summary">

              <div className="balance-summary-card balance-receive-summary">
                <span className="balance-summary-icon">
                  💚
                </span>

                <div>
                  <p>You should receive</p>

                  <h2>
                    ₹{totalReceivable.toFixed(2)}
                  </h2>

                  <small>
                    Money coming to you
                  </small>
                </div>
              </div>

              <div className="balance-summary-card balance-pay-summary">
                <span className="balance-summary-icon">
                  🔴
                </span>

                <div>
                  <p>Total to be paid</p>

                  <h2>
                    ₹{totalPayable.toFixed(2)}
                  </h2>

                  <small>
                    Your outstanding amount
                  </small>
                </div>
              </div>

              <div className="balance-summary-card balance-settled-summary">
                <span className="balance-summary-icon">
                  ⚪
                </span>

                <div>
                  <p>Settled members</p>

                  <h2>
                    {settledCount}
                  </h2>

                  <small>
                    No outstanding balance
                  </small>
                </div>
              </div>

            </section>

            {/* Balances */}

            <section className="balances-section">

              <div className="section-title">

                <div>
                  <h2>
                    Member Balances
                  </h2>

                  <p>
                    Current financial position of
                    each group member.
                  </p>
                </div>

                <span className="member-count-badge">
                  {balances.length}{" "}
                  {balances.length === 1
                    ? "Member"
                    : "Members"}
                </span>

              </div>

              {loading ? (
                <div className="empty-state balance-loading-state">
                  <div className="balance-loader">
                    ⟳
                  </div>

                  <h3>
                    Calculating balances...
                  </h3>

                  <p>
                    Please wait while DueEase
                    calculates the latest balances.
                  </p>
                </div>
              ) : balances.length === 0 ? (
                <div className="empty-state">
                  <div className="balance-empty-icon">
                    📊
                  </div>

                  <h3>
                    No balance data
                  </h3>

                  <p>
                    Add some expenses to this group
                    to calculate balances.
                  </p>
                </div>
              ) : (
                <div className="balance-list">

                  {balances.map((person) => {

                    const balance =
                      Number(person.balance);

                    const status =
                      getBalanceStatus(balance);

                    return (
                      <div
                        className={`balance-card balance-${status}`}
                        key={
                          person.user ||
                          person.email
                        }
                      >

                        <div className="balance-person">

                          <div className="balance-avatar">
                            {person.user
                              ? person.user
                                  .charAt(0)
                                  .toUpperCase()
                              : person.email
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                "U"}
                          </div>

                          <div>
                            <h3>
                              {person.user ||
                                "Unknown User"}
                            </h3>

                            <p>
                              {person.email}
                            </p>
                          </div>

                        </div>

                        <div className="balance-result">

                          {status === "receive" && (
                            <>
                              <span className="balance-label">
                                You should receive
                              </span>

                              <strong>
                                +₹
                                {balance.toFixed(
                                  2
                                )}
                              </strong>
                            </>
                          )}

                          {status === "pay" && (
                            <>
                              <span className="balance-label">
                                Needs to pay
                              </span>

                              <strong>
                                -₹
                                {Math.abs(
                                  balance
                                ).toFixed(2)}
                              </strong>
                            </>
                          )}

                          {status === "settled" && (
                            <>
                              <span className="balance-label">
                                Settled
                              </span>

                              <strong>
                                ₹0.00
                              </strong>
                            </>
                          )}

                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

            </section>

            {/* Explanation */}

            <section className="balance-info">

              <div className="balance-info-header">
                <span className="balance-info-icon">
                  💡
                </span>

                <div>
                  <h2>
                    How to read your balance
                  </h2>

                  <p>
                    Understand what each balance
                    status means.
                  </p>
                </div>
              </div>

              <div className="balance-info-grid">

                <div>
                  <strong>
                    💚 Positive balance
                  </strong>

                  <p>
                    This member should receive
                    money from the group.
                  </p>
                </div>

                <div>
                  <strong>
                    🔴 Negative balance
                  </strong>

                  <p>
                    This member needs to pay money
                    to the group.
                  </p>
                </div>

                <div>
                  <strong>
                    ⚪ Zero balance
                  </strong>

                  <p>
                    This member has no outstanding
                    amount.
                  </p>
                </div>

              </div>

            </section>

          </>
        )}

      </main>
    </div>
  );
}

export default Balances;