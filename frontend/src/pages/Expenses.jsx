import socket from "../socket";
import API_BASE_URL from "../config";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const expensesPerPage = 6;

  // --------------------------------------------------
  // Fetch Groups
  // --------------------------------------------------

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/groups`,
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
        toast.error(
          data.message || "Unable to load groups"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to connect to server"
      );
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // --------------------------------------------------
  // Selected Group
  // --------------------------------------------------

  const selectedGroupData = groups.find(
    (group) => group._id === selectedGroup
  );

  const members = selectedGroupData?.members || [];

  // --------------------------------------------------
  // Fetch Expenses
  // --------------------------------------------------

  const fetchExpenses = async (groupId) => {
    if (!groupId) {
      setExpenses([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/group/${groupId}`,
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
        toast.error(
          data.message || "Unable to load expenses"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to connect to server"
      );
    }
  };

  // --------------------------------------------------
  // Real-time Expense Updates
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }

    socket.connect();

    socket.emit(
      "joinGroup",
      selectedGroup
    );

    const handleExpenseAdded = (data) => {
      console.log(
        "Real-time expense added:",
        data
      );

      fetchExpenses(selectedGroup);
    };

    const handleExpenseDeleted = (data) => {
      console.log(
        "Real-time expense deleted:",
        data
      );

      fetchExpenses(selectedGroup);
    };

    socket.on(
      "expenseAdded",
      handleExpenseAdded
    );

    socket.on(
      "expenseDeleted",
      handleExpenseDeleted
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
    };
  }, [selectedGroup]);

  // --------------------------------------------------
  // Initialize Members
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Group Change
  // --------------------------------------------------

  const handleGroupChange = (e) => {
    const groupId = e.target.value;

    setSelectedGroup(groupId);
    setSearchTerm("");
    setFilterType("all");
    setCurrentPage(1);

    fetchExpenses(groupId);
  };

  // --------------------------------------------------
  // Split Type Change
  // --------------------------------------------------

  const handleSplitTypeChange = (e) => {
    const newSplitType = e.target.value;

    setSplitType(newSplitType);

    setSplits(
      members.map((member) => ({
        user: member._id,
        amount: "",
        percentage: ""
      }))
    );
  };

  // --------------------------------------------------
  // Split Value Change
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Split Calculations
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Create Expense
  // --------------------------------------------------

  const handleCreateExpense = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      toast.error(
        "Please select a group"
      );
      return;
    }

    if (!description.trim()) {
      toast.error(
        "Please enter expense description"
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error(
        "Please enter a valid amount"
      );
      return;
    }

    if (!paidBy) {
      toast.error(
        "Please select who paid"
      );
      return;
    }

    if (members.length === 0) {
      toast.error(
        "This group has no members"
      );
      return;
    }

    let finalSplits = [];

    // Equal Split
    if (splitType === "equal") {
      finalSplits = members.map(
        (member) => ({
          user: member._id
        })
      );
    }

    // Exact Split
    if (splitType === "exact") {
      if (
        Math.abs(
          totalExactAmount -
            Number(amount)
        ) > 0.01
      ) {
        toast.error(
          `Exact split total must equal ₹${Number(
            amount
          ).toFixed(
            2
          )}. Current total is ₹${totalExactAmount.toFixed(
            2
          )}.`
        );

        return;
      }

      finalSplits = splits.map(
        (split) => ({
          user: split.user,
          amount: Number(
            split.amount || 0
          )
        })
      );
    }

    // Percentage Split
    if (splitType === "percentage") {
      if (
        Math.abs(
          totalPercentage - 100
        ) > 0.01
      ) {
        toast.error(
          `Percentage total must equal 100%. Current total is ${totalPercentage.toFixed(
            2
          )}%.`
        );

        return;
      }

      finalSplits = splits.map(
        (split) => ({
          user: split.user,
          percentage: Number(
            split.percentage || 0
          )
        })
      );
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "token"
        );

      const response = await fetch(
        `${API_BASE_URL}/api/expenses`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            group: selectedGroup,
            description:
              description.trim(),
            amount: Number(amount),
            paidBy,
            splitType,
            splits: finalSplits
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        toast.success(
          "Expense added successfully!"
        );

        setDescription("");
        setAmount("");
        setSplitType("equal");

        setSplits(
          members.map(
            (member) => ({
              user: member._id,
              amount: "",
              percentage: ""
            })
          )
        );

        setCurrentPage(1);

        fetchExpenses(
          selectedGroup
        );
      } else {
        toast.error(
          data.message ||
            "Unable to add expense"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete Expense
  // --------------------------------------------------

  const handleDeleteExpense = async (
    expenseId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingExpenseId(
        expenseId
      );

      const token =
        localStorage.getItem(
          "token"
        );

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/${expenseId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        toast.success(
          "Expense deleted successfully!"
        );

        fetchExpenses(
          selectedGroup
        );
      } else {
        toast.error(
          data.message ||
            "Unable to delete expense"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to connect to server"
      );
    } finally {
      setDeletingExpenseId("");
    }
  };

  // --------------------------------------------------
  // Date Formatting
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  // --------------------------------------------------
  // Get Member Name
  // --------------------------------------------------

  const getMemberName = (
    userId
  ) => {
    const member =
      members.find(
        (item) =>
          item._id?.toString() ===
          userId?.toString()
      );

    return (
      member?.name ||
      "Unknown"
    );
  };

  // --------------------------------------------------
  // Expense Split Details
  // --------------------------------------------------

  const getExpenseSplitDetails = (
    expense
  ) => {
    if (!expense.splits) {
      return [];
    }

    return expense.splits.map(
      (split) => {
        const memberName =
          split.user?.name ||
          getMemberName(
            split.user?._id ||
              split.user
          );

        if (
          expense.splitType ===
          "percentage"
        ) {
          const percentage =
            Number(
              split.percentage ||
                0
            );

          const calculatedAmount =
            (Number(
              expense.amount
            ) *
              percentage) /
            100;

          return {
            name: memberName,
            value: `${percentage}%`,
            amount:
              calculatedAmount
          };
        }

        if (
          expense.splitType ===
          "exact"
        ) {
          const exactAmount =
            Number(
              split.amount || 0
            );

          return {
            name: memberName,
            value: `₹${exactAmount.toFixed(
              2
            )}`,
            amount:
              exactAmount
          };
        }

        const share =
          Number(
            expense.amount
          ) /
          (expense.splits.length ||
            1);

        return {
          name: memberName,
          value: `₹${share.toFixed(
            2
          )}`,
          amount: share
        };
      }
    );
  };

  // --------------------------------------------------
  // Search + Filter
  // --------------------------------------------------

  const filteredExpenses =
    expenses.filter(
      (expense) => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        const descriptionMatch =
          expense.description
            ?.toLowerCase()
            .includes(search);

        const paidByMatch =
          expense.paidBy?.name
            ?.toLowerCase()
            .includes(search);

        const searchMatch =
          !search ||
          descriptionMatch ||
          paidByMatch;

        const filterMatch =
          filterType === "all" ||
          expense.splitType ===
            filterType;

        return (
          searchMatch &&
          filterMatch
        );
      }
    );

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const totalPages =
    Math.ceil(
      filteredExpenses.length /
        expensesPerPage
    );

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages
  ]);

  const startIndex =
    (currentPage - 1) *
    expensesPerPage;

  const paginatedExpenses =
    filteredExpenses.slice(
      startIndex,
      startIndex +
        expensesPerPage
    );

  // --------------------------------------------------
  // Search Change
  // --------------------------------------------------

  const handleSearchChange = (
    e
  ) => {
    setSearchTerm(
      e.target.value
    );

    setCurrentPage(1);
  };

  // --------------------------------------------------
  // Filter Change
  // --------------------------------------------------

  const handleFilterChange = (
    e
  ) => {
    setFilterType(
      e.target.value
    );

    setCurrentPage(1);
  };

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const goToPage = (
    page
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top:
        document.querySelector(
          ".expenses-section"
        )?.offsetTop -
          100 ||
        0,
      behavior:
        "smooth"
    });
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div>

      <Navbar />

      <main className="page-container">

        <div className="page-header">

          <h1>
            Expenses
          </h1>

          <p>
            Record and manage
            shared group
            expenses.
          </p>

        </div>

        {/* Select Group */}

        <section className="form-card">

          <h2>
            Select Group
          </h2>

          <p>
            Choose a group to
            add and view shared
            expenses.
          </p>

          <select
            value={
              selectedGroup
            }
            onChange={
              handleGroupChange
            }
          >

            <option value="">
              Select a group
            </option>

            {groups.map(
              (group) => (
                <option
                  key={
                    group._id
                  }
                  value={
                    group._id
                  }
                >
                  {group.name}
                </option>
              )
            )}

          </select>

        </section>

        {selectedGroup && (
          <>

            {/* Add Expense */}

            <section className="expense-form-card">

              <h2>
                Add Expense
              </h2>

              <p className="form-description">
                Add a shared
                expense and choose
                how the amount
                should be divided.
              </p>

              <form
                onSubmit={
                  handleCreateExpense
                }
              >

                <label>
                  Description
                </label>

                <input
                  type="text"
                  placeholder="Example: Dinner"
                  value={
                    description
                  }
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

                  {members.map(
                    (member) => (
                      <option
                        key={
                          member._id
                        }
                        value={
                          member._id
                        }
                      >
                        {
                          member.name
                        }{" "}
                        -{" "}
                        {
                          member.email
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Split Type
                </label>

                <select
                  value={
                    splitType
                  }
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

                {splitType ===
                  "equal" && (
                  <div className="split-box">

                    <h3>
                      Equal Split
                    </h3>

                    <p>
                      The total
                      amount will be
                      divided equally
                      between all
                      members.
                    </p>

                    {amount &&
                      members.length >
                        0 && (
                        <div className="split-summary">

                          Each member
                          pays{" "}

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
                            key={
                              member._id
                            }
                          >

                            <div>

                              <strong>
                                {
                                  member.name
                                }
                              </strong>

                              <small>
                                {
                                  member.email
                                }
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

                {splitType ===
                  "exact" && (
                  <div className="split-box">

                    <h3>
                      Exact Amount
                      Split
                    </h3>

                    <p>
                      Enter the exact
                      amount each
                      member should
                      pay.
                    </p>

                    {splits.map(
                      (split) => {
                        const member =
                          members.find(
                            (m) =>
                              m._id ===
                              split.user
                          );

                        return (
                          <div
                            className="split-row"
                            key={
                              split.user
                            }
                          >

                            <div>

                              <strong>
                                {
                                  member?.name
                                }
                              </strong>

                              <small>
                                {
                                  member?.email
                                }
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
                                  e.target
                                    .value
                                )
                              }
                            />

                          </div>
                        );
                      }
                    )}

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
                          amount ||
                            0
                        ).toFixed(
                          2
                        )}
                      </strong>

                    </div>

                    {amount && (
                      <p>
                        Difference:
                        {" "}
                        ₹
                        {(
                          Number(
                            amount
                          ) -
                          totalExactAmount
                        ).toFixed(
                          2
                        )}
                      </p>
                    )}

                  </div>
                )}

                {/* Percentage Split */}

                {splitType ===
                  "percentage" && (
                  <div className="split-box">

                    <h3>
                      Percentage
                      Split
                    </h3>

                    <p>
                      Enter what
                      percentage of
                      the expense each
                      member should
                      pay.
                    </p>

                    {splits.map(
                      (split) => {
                        const member =
                          members.find(
                            (m) =>
                              m._id ===
                              split.user
                          );

                        const calculatedAmount =
                          (Number(
                            amount ||
                              0
                          ) *
                            Number(
                              split.percentage ||
                                0
                            )) /
                          100;

                        return (
                          <div
                            className="split-row"
                            key={
                              split.user
                            }
                          >

                            <div>

                              <strong>
                                {
                                  member?.name
                                }
                              </strong>

                              <small>
                                {
                                  member?.email
                                }
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
                                    e.target
                                      .value
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
                      }
                    )}

                    <div className="split-total">

                      <span>
                        Percentage
                        Total
                      </span>

                      <strong>
                        {totalPercentage.toFixed(
                          2
                        )}
                        %
                      </strong>

                    </div>

                    {Math.abs(
                      totalPercentage -
                        100
                    ) < 0.01 ? (
                      <p>
                        ✓ Percentage
                        split is valid
                      </p>
                    ) : (
                      <p>
                        Remaining:{" "}
                        {(
                          100 -
                          totalPercentage
                        ).toFixed(
                          2
                        )}
                        %
                      </p>
                    )}

                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
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
                  {
                    filteredExpenses.length
                  }{" "}
                  of{" "}
                  {
                    expenses.length
                  }{" "}
                  Expenses
                </span>

              </div>

              {/* Search + Filter */}

              <div className="expense-search-filter">

                <input
                  type="text"
                  placeholder="🔎 Search by description or payer..."
                  value={
                    searchTerm
                  }
                  onChange={
                    handleSearchChange
                  }
                />

                <select
                  value={
                    filterType
                  }
                  onChange={
                    handleFilterChange
                  }
                >

                  <option value="all">
                    All Split Types
                  </option>

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

              </div>

              {/* Empty State */}

              {filteredExpenses.length ===
              0 ? (

                <div className="empty-state">

                  <h3>
                    {expenses.length ===
                    0
                      ? "No expenses yet"
                      : "No matching expenses"}
                  </h3>

                  <p>
                    {expenses.length ===
                    0
                      ? "Add your first expense for this group."
                      : "Try changing your search or filter."}
                  </p>

                </div>

              ) : (

                <>

                  {/* Expense Cards */}

                  <div className="expenses-grid">

                    {paginatedExpenses.map(
                      (expense) => {

                        const splitDetails =
                          getExpenseSplitDetails(
                            expense
                          );

                        return (
                          <div
                            className="expense-card"
                            key={
                              expense._id
                            }
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
                                  ).toFixed(
                                    2
                                  )}
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

                            {splitDetails.length >
                              0 && (
                              <div className="expense-splits">

                                <h4>
                                  Individual
                                  Shares
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
                                        {
                                          split.value
                                        }

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
                      }
                    )}

                  </div>

                  {/* Pagination */}

                  {totalPages > 1 && (
                    <div className="expense-pagination">

                      <button
                        type="button"
                        disabled={
                          currentPage ===
                          1
                        }
                        onClick={() =>
                          goToPage(
                            currentPage -
                              1
                          )
                        }
                      >
                        ← Previous
                      </button>

                      <div className="page-numbers">

                        {Array.from(
                          {
                            length:
                              totalPages
                          },
                          (
                            _,
                            index
                          ) => {

                            const page =
                              index +
                              1;

                            return (
                              <button
                                type="button"
                                key={
                                  page
                                }
                                className={
                                  currentPage ===
                                  page
                                    ? "active"
                                    : ""
                                }
                                onClick={() =>
                                  goToPage(
                                    page
                                  )
                                }
                              >
                                {
                                  page
                                }
                              </button>
                            );
                          }
                        )}

                      </div>

                      <button
                        type="button"
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        onClick={() =>
                          goToPage(
                            currentPage +
                              1
                          )
                        }
                      >
                        Next →
                      </button>

                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="pagination-info">

                      Showing{" "}
                      {startIndex +
                        1}
                      -
                      {Math.min(
                        startIndex +
                          expensesPerPage,
                        filteredExpenses.length
                      )}{" "}
                      of{" "}
                      {
                        filteredExpenses.length
                      }{" "}
                      expenses

                      <br />

                      Page{" "}
                      {currentPage}{" "}
                      of{" "}
                      {totalPages}

                    </div>
                  )}

                </>

              )}

            </section>

          </>
        )}

      </main>
    </div>
  );
}

export default Expenses;