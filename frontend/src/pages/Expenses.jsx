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
  const [loading, setLoading] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState("");

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

  const handleSplitTypeChange = (e) => {
    setSplitType(e.target.value);

    setSplits(
      members.map((member) => ({
        user: member._id,
        amount: "",
        percentage: ""
      }))
    );
  };

  const handleSplitChange = (userId, field, value) => {
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

  const totalExactAmount = splits.reduce(
    (sum, split) =>
      sum + Number(split.amount || 0),
    0
  );

  const totalPercentage = splits.reduce(
    (sum, split) =>
      sum + Number(split.percentage || 0),
    0
  );

  const equalShare =
    members.length > 0 && amount
      ? Number(amount) / members.length
      : 0;

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

    if (members.length === 0) {
      alert("This group has no members");
      return;
    }

    let finalSplits = [];

    if (splitType === "equal") {
      finalSplits = members.map((member) => ({
        user: member._id
      }));
    }

    if (splitType === "exact") {
      if (
        Math.abs(
          totalExactAmount - Number(amount)
        ) > 0.01
      ) {
        alert(
          `Exact split total must equal ₹${Number(
            amount
          ).toFixed(2)}. Current total is ₹${totalExactAmount.toFixed(
            2
          )}.`
        );
        return;
      }

      finalSplits = splits.map((split) => ({
        user: split.user,
        amount: Number(split.amount || 0)
      }));
    }

    if (splitType === "percentage") {
      if (
        Math.abs(totalPercentage - 100) >
        0.01
      ) {
        alert(
          `Percentage total must equal 100%. Current total is ${totalPercentage.toFixed(
            2
          )}%.`
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
      setLoading(true);

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
            description: description.trim(),
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingExpenseId(expenseId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Expense deleted successfully!");
        fetchExpenses(selectedGroup);
      } else {
        alert(
          data.message ||
            "Unable to delete expense"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setDeletingExpenseId("");
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  const getMemberName = (userId) => {
    const member = members.find(
      (item) => item._id === userId
    );

    return member?.name || "Unknown";
  };

  const getExpenseSplitDetails = (expense) => {
    if (!expense.splits) {
      return [];
    }

    return expense.splits.map((split) => {
      const memberName =
        split.user?.name ||
        getMemberName(
          split.user?._id || split.user
        );

      if (
        expense.splitType ===
        "percentage"
      ) {
        const percentage = Number(
          split.percentage || 0
        );

        const calculatedAmount =
          Number(expense.amount) *
          percentage /
          100;

        return {
          name: memberName,
          value: `${percentage}%`,
          amount: calculatedAmount
        };
      }

      if (expense.splitType === "exact") {
        return {
          name: memberName,
          value: `₹${Number(
            split.amount || 0
          ).toFixed(2)}`,
          amount: Number(
            split.amount || 0
          )
        };
      }

      const share =
        Number(expense.amount) /
        (expense.splits.length || 1);

      return {
        name: memberName,
        value: `₹${share.toFixed(2)}`,
        amount: share
      };
    });
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

          <p>
            Choose a group to add and view shared
            expenses.
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
            {/* Add Expense */}

            <section className="expense-form-card">
              <h2>Add Expense</h2>

              <p className="form-description">
                Add a shared expense and choose how
                the amount should be divided.
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
                  Total Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Example: 900"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                />

                <label>
                  Paid By
                </label>

                <select
                  value={paidBy}
                  onChange={(e) =>
                    setPaidBy(e.target.value)
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
                  onChange={
                    handleSplitTypeChange
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

                {/* Equal Split */}

                {splitType === "equal" && (
                  <div className="split-box">

                    <h3>
                      Equal Split
                    </h3>

                    <p>
                      The total amount will be
                      divided equally between all
                      members.
                    </p>

                    {amount &&
                      members.length > 0 && (
                        <div className="split-summary">
                          Each member pays{" "}
                          <strong>
                            ₹
                            {equalShare.toFixed(
                              2
                            )}
                          </strong>
                        </div>
                      )}

                    <div className="split-members">

                      {members.map(
                        (member) => (
                          <div
                            className="split-row"
                            key={member._id}
                          >
                            <div>
                              <strong>
                                {member.name}
                              </strong>

                              <small>
                                {member.email}
                              </small>
                            </div>

                            <strong>
                              ₹
                              {equalShare.toFixed(
                                2
                              )}
                            </strong>
                          </div>
                        )
                      )}

                    </div>
                  </div>
                )}

                {/* Exact Split */}

                {splitType === "exact" && (
                  <div className="split-box">

                    <h3>
                      Exact Amount Split
                    </h3>

                    <p>
                      Enter the exact amount each
                      member should pay.
                    </p>

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
                          <div>
                            <strong>
                              {member?.name}
                            </strong>

                            <small>
                              {member?.email}
                            </small>
                          </div>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
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
                        </div>
                      );
                    })}

                    <div className="split-total">
                      <span>
                        Split Total
                      </span>

                      <strong>
                        ₹
                        {totalExactAmount.toFixed(
                          2
                        )}
                      </strong>
                    </div>

                    <div className="split-total">
                      <span>
                        Required Total
                      </span>

                      <strong>
                        ₹
                        {Number(
                          amount || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    {amount && (
                      <p>
                        Difference: ₹
                        {(
                          Number(amount) -
                          totalExactAmount
                        ).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                {/* Percentage Split */}

                {splitType ===
                  "percentage" && (
                  <div className="split-box">

                    <h3>
                      Percentage Split
                    </h3>

                    <p>
                      Enter what percentage of the
                      expense each member should pay.
                    </p>

                    {splits.map((split) => {
                      const member =
                        members.find(
                          (m) =>
                            m._id ===
                            split.user
                        );

                      const calculatedAmount =
                        Number(amount || 0) *
                        Number(
                          split.percentage || 0
                        ) /
                        100;

                      return (
                        <div
                          className="split-row"
                          key={split.user}
                        >
                          <div>
                            <strong>
                              {member?.name}
                            </strong>

                            <small>
                              {member?.email}
                            </small>
                          </div>

                          <div className="percentage-input">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
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

                            <span>
                              ₹
                              {calculatedAmount.toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="split-total">
                      <span>
                        Percentage Total
                      </span>

                      <strong>
                        {totalPercentage.toFixed(
                          2
                        )}
                        %
                      </strong>
                    </div>

                    {Math.abs(
                      totalPercentage - 100
                    ) < 0.01 ? (
                      <p>
                        ✓ Percentage split is
                        valid
                      </p>
                    ) : (
                      <p>
                        Remaining:{" "}
                        {(
                          100 -
                          totalPercentage
                        ).toFixed(2)}
                        %
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Adding Expense..."
                    : "Add Expense"}
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

                  {expenses.map((expense) => {

                    const splitDetails =
                      getExpenseSplitDetails(
                        expense
                      );

                    return (
                      <div
                        className="expense-card"
                        key={expense._id}
                      >

                        {/* Header */}

                        <div className="expense-card-header">

                          <div>
                            <h3>
                              {
                                expense.description
                              }
                            </h3>

                            <p>
                              Paid by{" "}
                              <strong>
                                {
                                  expense
                                    .paidBy
                                    ?.name ||
                                  "Unknown"
                                }
                              </strong>
                            </p>
                          </div>

                          <div>
                            <strong>
                              ₹
                              {Number(
                                expense.amount
                              ).toFixed(2)}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteExpense(
                                  expense._id
                                )
                              }
                              disabled={
                                deletingExpenseId ===
                                expense._id
                              }
                            >
                              {deletingExpenseId ===
                              expense._id
                                ? "Deleting..."
                                : "🗑️ Delete"}
                            </button>
                          </div>

                        </div>

                        {/* Expense Meta */}

                        <div className="expense-details">

                          <span>
                            🔀 Split:{" "}
                            <strong>
                              {expense.splitType ===
                              "equal"
                                ? "Equal"
                                : expense.splitType ===
                                  "exact"
                                ? "Exact"
                                : "Percentage"}
                            </strong>
                          </span>

                          <span>
                            📅{" "}
                            {formatDate(
                              expense.createdAt
                            )}
                          </span>

                        </div>

                        {/* Individual Shares */}

                        {splitDetails.length >
                          0 && (
                          <div className="expense-splits">

                            <h4>
                              Individual Shares
                            </h4>

                            {splitDetails.map(
                              (
                                split,
                                index
                              ) => (
                                <div
                                  className="expense-split-row"
                                  key={`${expense._id}-${index}`}
                                >
                                  <span>
                                    {
                                      split.name
                                    }
                                  </span>

                                  <strong>
                                    {split.value}

                                    {expense.splitType ===
                                      "percentage" && (
                                      <small>
                                        {" "}
                                        (
                                        ₹
                                        {split.amount.toFixed(
                                          2
                                        )}
                                        )
                                      </small>
                                    )}
                                  </strong>
                                </div>
                              )
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })}

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