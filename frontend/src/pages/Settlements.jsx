import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Settlements() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Please login again");
          return;
        }

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
          setGroups(data.groups || data || []);
        } else {
          alert(
            data.message || "Unable to load groups"
          );
        }
      } catch (error) {
        console.error(error);
        alert("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const fetchSettlements = async (groupId) => {
    if (!groupId) {
      setSettlements([]);
      return;
    }

    try {
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
        alert(
          data.message ||
            "Unable to load settlements"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    fetchSettlements(groupId);
  };

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

        {/* Group Selection */}

        <section className="form-card settlement-selector">
          <h2>Select Group</h2>

          <p>
            Choose a group to generate its settlement
            plan.
          </p>

          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <h3>No groups found</h3>

              <p>
                Create a group first to generate
                settlements.
              </p>
            </div>
          ) : (
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
          )}
        </section>

        {/* Settlement Plan */}

        {selectedGroup && (
          <section className="settlements-section">

            <div className="section-title">
              <div>
                <h2>Settlement Plan</h2>

                <p className="section-subtitle">
                  Minimum transactions required to
                  settle all group debts.
                </p>
              </div>

              <span>
                {settlements.length} Payments
              </span>
            </div>

            {settlements.length === 0 ? (
              <div className="empty-state">
                <div className="settlement-success-icon">
                  ✓
                </div>

                <h3>All settled!</h3>

                <p>
                  No payments are currently required
                  for this group.
                </p>
              </div>
            ) : (
              <div className="settlements-grid">

                {settlements.map(
                  (settlement, index) => (
                    <div
                      className="settlement-card"
                      key={index}
                    >

                      <div className="settlement-number">
                        {index + 1}
                      </div>

                      <div className="settlement-content">

                        <div className="settlement-payment">

                          <div className="settlement-person">
                            <div className="settlement-avatar">
                              {settlement.from
                                ? settlement.from
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </div>

                            <div>
                              <span className="settlement-label">
                                Pays
                              </span>

                              <strong>
                                {settlement.from}
                              </strong>

                              <small>
                                {settlement.fromEmail}
                              </small>
                            </div>
                          </div>

                          <div className="settlement-arrow">
                            →
                          </div>

                          <div className="settlement-person">
                            <div className="settlement-avatar receiver">
                              {settlement.to
                                ? settlement.to
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </div>

                            <div>
                              <span className="settlement-label">
                                Receives
                              </span>

                              <strong>
                                {settlement.to}
                              </strong>

                              <small>
                                {settlement.toEmail}
                              </small>
                            </div>
                          </div>

                        </div>

                        <div className="settlement-amount">
                          ₹
                          {Number(
                            settlement.amount
                          ).toFixed(2)}
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

export default Settlements;