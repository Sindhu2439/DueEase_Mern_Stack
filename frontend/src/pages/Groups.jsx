import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "../Navbar";
import socket from "../socket";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingMember, setAddingMember] = useState(false);


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
        setGroups(data.groups || data || []);
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

    } finally {
      setLoading(false);
    }
  };


  // ==================== SOCKET ====================

  useEffect(() => {
    fetchGroups();

    socket.connect();

    const handleGroupUpdated = () => {
      fetchGroups();
    };

    socket.on(
      "groupUpdated",
      handleGroupUpdated
    );

    return () => {
      socket.off(
        "groupUpdated",
        handleGroupUpdated
      );

      socket.disconnect();
    };
  }, []);


  // ==================== JOIN GROUP ROOMS ====================

  useEffect(() => {
    if (groups.length > 0) {
      groups.forEach((group) => {
        socket.emit(
          "joinGroup",
          group._id
        );
      });
    }
  }, [groups]);


  // ==================== CREATE GROUP ====================

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error(
        "Please enter a group name"
      );
      return;
    }

    try {
      setCreatingGroup(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/groups",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            name: groupName.trim()
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {

        toast.success(
          "Group created successfully!"
        );

        setGroupName("");

        await fetchGroups();

      } else {

        toast.error(
          data.message ||
          "Unable to create group"
        );
      }

    } catch (error) {

      console.error(error);

      toast.error(
        "Unable to connect to server"
      );

    } finally {

      setCreatingGroup(false);

    }
  };


  // ==================== ADD MEMBER ====================

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      toast.error(
        "Please select a group"
      );
      return;
    }

    if (!memberEmail.trim()) {
      toast.error(
        "Please enter member email"
      );
      return;
    }

    try {

      setAddingMember(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/groups/${selectedGroup}/members`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            email:
              memberEmail.trim()
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {

        toast.success(
          "Member added successfully!"
        );

        setMemberEmail("");

        await fetchGroups();

      } else {

        toast.error(
          data.message ||
          "Unable to add member"
        );
      }

    } catch (error) {

      console.error(error);

      toast.error(
        "Unable to connect to server"
      );

    } finally {

      setAddingMember(false);

    }
  };


  // ==================== TOTAL MEMBERS ====================

  const totalMembers =
    groups.reduce(
      (total, group) =>
        total +
        (group.members?.length || 0),
      0
    );


  // ==================== UI ====================

  return (
    <div>

      <Navbar />

      <main className="page-container">


        {/* ==================== HEADER ==================== */}

        <div className="page-header">

          <span className="dashboard-badge">
            Group Management
          </span>

          <h1>
            My Groups
          </h1>

          <p>
            Create groups, add members, and organize
            shared expenses with ease.
          </p>

        </div>


        {/* ==================== STATS ==================== */}

        <section className="dashboard-stats">


          <div className="stat-card">

            <div className="stat-icon">
              👥
            </div>

            <div>

              <span>
                Total Groups
              </span>

              <h2>
                {loading
                  ? "..."
                  : groups.length}
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🧑‍🤝‍🧑
            </div>

            <div>

              <span>
                Total Members
              </span>

              <h2>
                {loading
                  ? "..."
                  : totalMembers}
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              📊
            </div>

            <div>

              <span>
                Expense Groups
              </span>

              <h2>
                {loading
                  ? "..."
                  : groups.length}
              </h2>

            </div>

          </div>


        </section>


        {/* ==================== FORMS ==================== */}

        <div className="form-grid">


          {/* ==================== CREATE GROUP ==================== */}

          <section className="form-card">

            <div className="group-form-icon">
              ➕
            </div>

            <h2>
              Create New Group
            </h2>

            <p>
              Create a group for friends, roommates,
              college expenses, or trips.
            </p>

            <form
              onSubmit={
                handleCreateGroup
              }
            >

              <label>
                Group Name
              </label>

              <input
                type="text"
                placeholder="Example: Goa Trip"
                value={groupName}
                onChange={(e) =>
                  setGroupName(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  creatingGroup
                }
              >
                {creatingGroup
                  ? "Creating..."
                  : "Create Group"}
              </button>

            </form>

          </section>


          {/* ==================== ADD MEMBER ==================== */}

          <section className="form-card">

            <div className="group-form-icon">
              👤
            </div>

            <h2>
              Add Member
            </h2>

            <p>
              Add an existing DueEase user to one
              of your groups.
            </p>

            <form
              onSubmit={
                handleAddMember
              }
            >

              <label>
                Select Group
              </label>

              <select
                value={
                  selectedGroup
                }
                onChange={(e) =>
                  setSelectedGroup(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select a group
                </option>

                {groups.map(
                  (group) => (

                    <option
                      key={group._id}
                      value={group._id}
                    >
                      {group.name}
                    </option>

                  )
                )}

              </select>


              <label>
                Member Email
              </label>

              <input
                type="email"
                placeholder="Enter member email"
                value={memberEmail}
                onChange={(e) =>
                  setMemberEmail(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  addingMember
                }
              >
                {addingMember
                  ? "Adding..."
                  : "Add Member"}
              </button>

            </form>

          </section>


        </div>


        {/* ==================== GROUPS ==================== */}

        <section className="groups-section">


          <div className="section-title">

            <div>

              <h2>
                Your Groups
              </h2>

              <p>
                View members and manage your expense
                groups.
              </p>

            </div>

            <span>

              {groups.length}{" "}

              {groups.length === 1
                ? "Group"
                : "Groups"}

            </span>

          </div>


          {/* ==================== LOADING ==================== */}

          {loading ? (

            <div className="empty-state">

              <h3>
                Loading groups...
              </h3>

              <p>
                Please wait while your groups are
                loaded.
              </p>

            </div>


          ) : groups.length === 0 ? (


            /* ==================== EMPTY ==================== */

            <div className="empty-state">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No groups yet
              </h3>

              <p>
                Create your first group to start
                tracking shared expenses.
              </p>

            </div>


          ) : (


            /* ==================== GROUP GRID ==================== */

            <div className="groups-grid">

              {groups.map(
                (group) => (

                  <div
                    className="group-card"
                    key={group._id}
                  >


                    <div className="group-card-header">

                      <div className="group-title-area">

                        <div className="group-large-icon">
                          👥
                        </div>

                        <div>

                          <h3>
                            {group.name}
                          </h3>

                          <p>

                            {group.members?.length ||
                              0}{" "}

                            {group.members?.length ===
                            1
                              ? "member"
                              : "members"}

                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="group-member-summary">

                      <span>
                        Members
                      </span>

                      <strong>
                        {group.members?.length ||
                          0}
                      </strong>

                    </div>


                    <div className="group-members-container">

                      <h4>
                        Group Members
                      </h4>


                      {group.members &&
                      group.members.length >
                        0 ? (

                        <ul className="member-list">

                          {group.members.map(
                            (member) => (

                              <li
                                key={
                                  member._id
                                }
                              >

                                <div className="member-avatar">

                                  {member.name
                                    ? member.name
                                        .charAt(
                                          0
                                        )
                                        .toUpperCase()
                                    : "U"}

                                </div>


                                <div className="member-info">

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

                              </li>

                            )
                          )}

                        </ul>

                      ) : (

                        <div className="no-members">
                          No members found.
                        </div>

                      )}

                    </div>


                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ==================== HIGHLIGHT ==================== */}

        <section className="dashboard-highlight">

          <div>

            <span className="dashboard-badge">
              Smart Group Management
            </span>

            <h2>
              Keep shared expenses organized.
            </h2>

            <p>
              DueEase connects groups, members,
              expenses, balances, and settlements
              into one complete expense management
              workflow.
            </p>

          </div>

        </section>


      </main>

    </div>
  );
}

export default Groups;