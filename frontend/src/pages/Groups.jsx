import { useEffect, useState } from "react";

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
      <h1>My Groups</h1>

      <h2>Create New Group</h2>

      <form onSubmit={handleCreateGroup}>
        <input
          type="text"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <button type="submit">
          Create Group
        </button>
      </form>

      <hr />

      <h2>Add Member</h2>

      <form onSubmit={handleAddMember}>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Select a group</option>

          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>

        <input
          type="email"
          placeholder="Enter member email"
          value={memberEmail}
          onChange={(e) => setMemberEmail(e.target.value)}
        />

        <button type="submit">
          Add Member
        </button>
      </form>

      <hr />

      <h2>Your Groups</h2>

      {loading ? (
        <p>Loading groups...</p>
      ) : groups.length === 0 ? (
        <p>No groups found.</p>
      ) : (
        groups.map((group) => (
          <div key={group._id}>
            <h3>{group.name}</h3>
            <p>
              Members: {group.members ? group.members.length : 0}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default Groups;