import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);

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
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/groups",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: groupName
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Group created successfully!");
        setGroupName("");
        fetchGroups();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      alert("Please select a group");
      return;
    }

    if (!memberEmail.trim()) {
      alert("Please enter member email");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/groups/${selectedGroup}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: memberEmail
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Member added successfully!");
        setMemberEmail("");
        fetchGroups();
      } else {
        alert(data.message);
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
          <h1>My Groups</h1>

          <p>
            Create groups and manage members for shared
            expenses.
          </p>
        </div>

        <div className="form-grid">

          {/* Create Group */}

          <section className="form-card">
            <h2>Create New Group</h2>

            <p>
              Create a group for your friends, roommates,
              or trips.
            </p>

            <form onSubmit={handleCreateGroup}>
              <label>Group Name</label>

              <input
                type="text"
                placeholder="Example: Goa Trip"
                value={groupName}
                onChange={(e) =>
                  setGroupName(e.target.value)
                }
              />

              <button type="submit">
                Create Group
              </button>
            </form>
          </section>

          {/* Add Member */}

          <section className="form-card">
            <h2>Add Member</h2>

            <p>
              Add an existing DueEase user to a group.
            </p>

            <form onSubmit={handleAddMember}>
              <label>Select Group</label>

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

              <label>Member Email</label>

              <input
                type="email"
                placeholder="Enter member email"
                value={memberEmail}
                onChange={(e) =>
                  setMemberEmail(e.target.value)
                }
              />

              <button type="submit">
                Add Member
              </button>
            </form>
          </section>
        </div>

        {/* Groups */}

        <section className="groups-section">
          <div className="section-title">
            <h2>Your Groups</h2>

            <span>
              {groups.length} Groups
            </span>
          </div>

          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <h3>No groups yet</h3>

              <p>
                Create your first group to start tracking
                shared expenses.
              </p>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => (
                <div
                  className="group-card"
                  key={group._id}
                >
                  <div className="group-card-header">
                    <div>
                      <h3>{group.name}</h3>

                      <p>
                        {group.members
                          ? group.members.length
                          : 0}{" "}
                        members
                      </p>
                    </div>

                    <span className="group-icon">
                      👥
                    </span>
                  </div>

                  <hr />

                  <h4>Members</h4>

                  {group.members &&
                  group.members.length > 0 ? (
                    <ul className="member-list">
                      {group.members.map((member) => (
                        <li key={member._id}>
                          <div className="member-avatar">
                            {member.name
                              ? member.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <div>
                            <strong>
                              {member.name}
                            </strong>

                            <small>
                              {member.email}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No members found.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Groups;