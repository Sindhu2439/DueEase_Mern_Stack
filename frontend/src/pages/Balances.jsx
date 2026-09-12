import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Balances() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [balances, setBalances] = useState([]);
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

  const fetchBalances = async (groupId) => {
    if (!groupId) {
      setBalances([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/expenses/group/${groupId}/balances`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBalances(data.balances || []);
      } else {
        alert(
          data.message || "Unable to load balances"
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
    fetchBalances(groupId);
  };

  const getBalanceStatus = (balance) => {
    if (balance > 0) {
      return {
        text: "Should receive",
        icon: "↑",
        className: "positive"
      };
    }

    if (balance < 0) {
      return {
        text: "Owes money",
        icon: "↓",
        className: "negative"
      };
    }

    return {
      text: "Settled",
      icon: "✓",
      className: "neutral"
    };
  };

  return (
    <div>
      <Navbar />

      <main className="page-container">

        <div className="page-header">
          <h1>Balances</h1>

          <p>
            Track who owes money and who should receive
            money in your group.
          </p>
        </div>

        {/* Group Selection */}

        <section className="form-card balance-selector">
          <h2>Select Group</h2>

          <p>
            Choose a group to view its current balances.
          </p>

          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <h3>No groups found</h3>

              <p>
                Create a group first to view balances.
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

        {/* Balances */}

        {selectedGroup && (
          <section className="balances-section">

            <div className="section-title">
              <div>
                <h2>Group Balances</h2>

                <p className="section-subtitle">
                  Current financial position of each
                  member.
                </p>
              </div>

              <span>
                {balances.length} Members
              </span>
            </div>

            {balances.length === 0 ? (
              <div className="empty-state">
                <h3>No balances available</h3>

                <p>
                  Add some expenses to calculate
                  balances.
                </p>
              </div>
            ) : (
              <div className="balances-grid">

                {balances.map((person) => {
                  const balance = Number(
                    person.balance
                  );

                  const status =
                    getBalanceStatus(balance);

                  return (
                    <div
                      className={`balance-card ${status.className}`}
                      key={person.user}
                    >

                      <div className="balance-card-top">

                        <div className="balance-avatar">
                          {person.user
                            ? person.user
                                .charAt(0)
                                .toUpperCase()
                            : "U"}
                        </div>

                        <div>
                          <h3>
                            {person.user}
                          </h3>

                          <p>
                            {person.email}
                          </p>
                        </div>

                      </div>

                      <div className="balance-card-divider" />

                      <div className="balance-status">
                        <span
                          className="balance-status-icon"
                        >
                          {status.icon}
                        </span>

                        <span>
                          {status.text}
                        </span>
                      </div>

                      <div className="balance-amount">
                        ₹
                        {Math.abs(balance).toFixed(2)}
                      </div>

                      <div className="balance-description">

                        {balance > 0 && (
                          <span>
                            This member should receive
                            this amount.
                          </span>
                        )}

                        {balance < 0 && (
                          <span>
                            This member needs to pay
                            this amount.
                          </span>
                        )}

                        {balance === 0 && (
                          <span>
                            This member has no pending
                            balance.
                          </span>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

export default Balances;