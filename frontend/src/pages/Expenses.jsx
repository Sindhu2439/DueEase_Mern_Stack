import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Expenses() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const [splitType, setSplitType] = useState("equal");

  const [splits, setSplits] = useState([]);
  const [expenses, setExpenses] = useState([]);

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

  const selectedGroupData = groups.find(
    (group) => group._id === selectedGroup
  );

  const members = selectedGroupData?.members || [];

  useEffect(() => {
    if (members.length > 0) {
      setPaidBy(members[0]._id);

      setSplits(
        members.map((member) => ({
          user: member._id,
          amount: "",
          percentage: ""
        }))
      );
    } else {
      setPaidBy("");
      setSplits([]);
    }
  }, [selectedGroup, groups]);

  const fetchExpenses = async (groupId) => {
    if (!groupId) {
      setExpenses([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/expenses/group/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenses(data.expenses || []);
      } else {
        alert(data.message || "Unable to load expenses");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    fetchExpenses(groupId);
  };

  const handleSplitChange = (
    userId,
    field,
    value
  ) => {
    setSplits((previousSplits) =>
      previousSplits.map((split) =>
        split.user === userId
          ? {
              ...split,
              [field]: value
            }
          : split
      )
    );
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      alert("Please select a group");
      return;
    }

    if (!description.trim()) {
      alert("Please enter expense description");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!paidBy) {
      alert("Please select who paid");
      return;
    }

    let finalSplits = [];

    if (splitType === "equal") {
      finalSplits = members.map((member) => ({
        user: member._id
      }));
    }

    if (splitType === "exact") {
      const total = splits.reduce(
        (sum, split) =>
          sum + Number(split.amount || 0),
        0
      );

      if (
        Math.abs(total - Number(amount)) >
        0.01
      ) {
        alert(
          `Exact split total must equal ₹${amount}. Current total is ₹${total}.`
        );
        return;
      }

      finalSplits = splits.map((split) => ({
        user: split.user,
        amount: Number(split.amount || 0)
      }));
    }

    if (splitType === "percentage") {
      const totalPercentage = splits.reduce(
        (sum, split) =>
          sum + Number(split.percentage || 0),
        0
      );

      if (
        Math.abs(totalPercentage - 100) >
        0.01
      ) {
        alert(
          `Percentage total must equal 100%. Current total is ${totalPercentage}%.`
        );
        return;
      }

      finalSplits = splits.map((split) => ({
        user: split.user,
        percentage: Number(
          split.percentage || 0
        )
      }));
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/expenses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            group: selectedGroup,
            description,
            amount: Number(amount),
            paidBy,
            splitType,
            splits: finalSplits
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Expense added successfully!");

        setDescription("");
        setAmount("");
        setSplitType("equal");

        setSplits(
          members.map((member) => ({
            user: member._id,
            amount: "",
            percentage: ""
          }))
        );

        fetchExpenses(selectedGroup);
      } else {
        alert(
          data.message ||
            "Unable to add expense"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  return (
    <div>
      <Navbar />

      <main className="page-container">

        <div className="page-header">
          <h1>Expenses</h1>

          <p>
            Record and manage shared group expenses.
          </p>
        </div>

        {/* Select Group */}

        <section className="form-card">
          <h2>Select Group</h2>

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
            {/* Add Expense */}

            <section className="expense-form-card">
              <h2>Add Expense</h2>

              <p className="form-description">
                Add a shared expense and choose how
                it should be divided.
              </p>

              <form
                onSubmit={handleCreateExpense}
              >
                <label>
                  Description
                </label>

                <input
                  type="text"
                  placeholder="Example: Dinner"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                />

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  placeholder="Example: 900"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                />

                <label>
                  Paid By
                </label>

                <select
                  value={paidBy}
                  onChange={(e) =>
                    setPaidBy(
                      e.target.value
                    )
                  }
                >
                  {members.map((member) => (
                    <option
                      key={member._id}
                      value={member._id}
                    >
                      {member.name} -{" "}
                      {member.email}
                    </option>
                  ))}
                </select>

                <label>
                  Split Type
                </label>

                <select
                  value={splitType}
                  onChange={(e) =>
                    setSplitType(
                      e.target.value
                    )
                  }
                >
                  <option value="equal">
                    Equal Split
                  </option>

                  <option value="exact">
                    Exact Amount
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>
                </select>

                {splitType !== "equal" && (
                  <div className="split-box">
                    <h3>
                      Split Details
                    </h3>

                    {splits.map((split) => {
                      const member =
                        members.find(
                          (m) =>
                            m._id ===
                            split.user
                        );

                      return (
                        <div
                          className="split-row"
                          key={split.user}
                        >
                          <span>
                            {member?.name}
                          </span>

                          {splitType ===
                            "exact" && (
                            <input
                              type="number"
                              placeholder="₹ Amount"
                              value={
                                split.amount
                              }
                              onChange={(e) =>
                                handleSplitChange(
                                  split.user,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          )}

                          {splitType ===
                            "percentage" && (
                            <input
                              type="number"
                              placeholder="%"
                              value={
                                split.percentage
                              }
                              onChange={(e) =>
                                handleSplitChange(
                                  split.user,
                                  "percentage",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button type="submit">
                  Add Expense
                </button>
              </form>
            </section>

            {/* Expense History */}

            <section className="expenses-section">
              <div className="section-title">
                <h2>
                  Expense History
                </h2>

                <span>
                  {expenses.length} Expenses
                </span>
              </div>

              {expenses.length === 0 ? (
                <div className="empty-state">
                  <h3>
                    No expenses yet
                  </h3>

                  <p>
                    Add your first expense for
                    this group.
                  </p>
                </div>
              ) : (
                <div className="expenses-grid">
                  {expenses.map(
                    (expense) => (
                      <div
                        className="expense-card"
                        key={expense._id}
                      >
                        <div className="expense-card-header">
                          <div>
                            <h3>
                              {
                                expense.description
                              }
                            </h3>

                            <p>
                              Paid by{" "}
                              {
                                expense
                                  .paidBy
                                  ?.name
                              }
                            </p>
                          </div>

                          <strong>
                            ₹
                            {
                              expense.amount
                            }
                          </strong>
                        </div>

                        <div className="expense-details">
                          <span>
                            Split:{" "}
                            {
                              expense.splitType
                            }
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Expenses;