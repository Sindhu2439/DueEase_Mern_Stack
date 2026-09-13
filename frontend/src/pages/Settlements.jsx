import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Settlements() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setGroups(data.groups || data);
      } else {
        alert(data.message || "Unable to load groups");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchSettlements = async (groupId) => {
    if (!groupId) {
      setSettlements([]);
      return;
    }

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
        setSettlements(data.settlements || []);
      } else {
        alert(
          data.message ||
            "Unable to calculate settlements"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    fetchSettlements(groupId);
  };

  const totalSettlementAmount = settlements.reduce(
    (total, settlement) =>
      total + Number(settlement.amount || 0),
    0
  );

  return (
    <div>
      <Navbar />

      <main className="page-container">

        <div className="page-header">
          <h1>Settlements</h1>

          <p>
            Find the minimum payments needed to settle
            group debts.
          </p>
        </div>

        {/* Select Group */}

        <section className="form-card">
          <h2>Select Group</h2>

          <p>
            Choose a group to calculate the optimized
            settlement plan.
          </p>

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

        {selectedGroup && (
          <>
            {/* Summary */}

            <section className="settlement-summary">

              <div className="settlement-summary-card">
                <span className="settlement-icon">
                  🤝
                </span>

                <div>
                  <p>
                    Required Payments
                  </p>

                  <h2>
                    {settlements.length}
                  </h2>
                </div>
              </div>

              <div className="settlement-summary-card">
                <span className="settlement-icon">
                  💰
                </span>

                <div>
                  <p>
                    Total Settlement Amount
                  </p>

                  <h2>
                    ₹
                    {totalSettlementAmount.toFixed(
                      2
                    )}
                  </h2>
                </div>
              </div>

            </section>

            {/* Settlement Plan */}

            <section className="settlements-section">

              <div className="section-title">

                <div>
                  <h2>
                    Settlement Plan
                  </h2>

                  <p>
                    DueEase simplifies the group's
                    debts into the minimum necessary
                    payments.
                  </p>
                </div>

                <span>
                  {settlements.length} Payments
                </span>

              </div>

              {loading ? (
                <div className="empty-state">

                  <h3>
                    Calculating settlements...
                  </h3>

                  <p>
                    DueEase is optimizing the payment
                    plan.
                  </p>

                </div>
              ) : settlements.length === 0 ? (
                <div className="empty-state">

                  <h3>
                    🎉 No payments required
                  </h3>

                  <p>
                    Everyone in this group is
                    currently settled.
                  </p>

                </div>
              ) : (
                <div className="settlement-list">

                  {settlements.map(
                    (settlement, index) => (
                      <div
                        className="settlement-card"
                        key={index}
                      >

                        <div className="settlement-person">

                          <div className="settlement-avatar">
                            {settlement.from
                              ? settlement.from
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <div>
                            <span>
                              From
                            </span>

                            <h3>
                              {settlement.from ||
                                "Unknown"}
                            </h3>

                            <p>
                              {settlement.fromEmail}
                            </p>
                          </div>

                        </div>

                        <div className="settlement-arrow">
                          →
                        </div>

                        <div className="settlement-person">

                          <div className="settlement-avatar">
                            {settlement.to
                              ? settlement.to
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <div>
                            <span>
                              To
                            </span>

                            <h3>
                              {settlement.to ||
                                "Unknown"}
                            </h3>

                            <p>
                              {settlement.toEmail}
                            </p>
                          </div>

                        </div>

                        <div className="settlement-amount">

                          <span>
                            Amount
                          </span>

                          <strong>
                            ₹
                            {Number(
                              settlement.amount
                            ).toFixed(2)}
                          </strong>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>

            {/* How It Works */}

            <section className="settlement-info">

              <h2>
                How DueEase simplifies debts
              </h2>

              <p>
                Instead of requiring every person to
                pay every other person separately,
                DueEase calculates an optimized
                settlement plan.
              </p>

              <div className="settlement-info-grid">

                <div>
                  <span>
                    1
                  </span>

                  <h3>
                    Calculate balances
                  </h3>

                  <p>
                    Determine who should receive
                    money and who needs to pay.
                  </p>
                </div>

                <div>
                  <span>
                    2
                  </span>

                  <h3>
                    Match debts
                  </h3>

                  <p>
                    Match people who owe money with
                    people who should receive money.
                  </p>
                </div>

                <div>
                  <span>
                    3
                  </span>

                  <h3>
                    Minimize payments
                  </h3>

                  <p>
                    Generate a smaller set of
                    transactions to settle the group.
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

export default Settlements;