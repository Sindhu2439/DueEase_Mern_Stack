import { useEffect, useState } from "react";
import Navbar from "../Navbar";

function Profile() {
    const [user, setUser] = useState(null);
    const [upiId, setUpiId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/auth/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setUpiId(data.user.upiId || "");
            } else {
                setError(data.message || "Failed to load profile");
            }
        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveUPI = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!upiId.trim()) {
            setError("Please enter your UPI ID");
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/auth/upi",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        upiId: upiId.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setUpiId(data.user.upiId || "");
                setMessage("UPI ID updated successfully!");
            } else {
                setError(data.message || "Failed to update UPI ID");
            }
        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="app">
                <Navbar />

                <div className="container">
                    <div className="card">
                        <p>Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app">

            <Navbar />

            <div className="container">

                <div className="page-header">
                    <div>
                        <h1>My Profile</h1>

                        <p>
                            Manage your DueEase account
                            and payment details.
                        </p>
                    </div>
                </div>

                {error && (
                    <div
                        className="card"
                        style={{
                            borderLeft: "5px solid #ef4444",
                            marginBottom: "20px"
                        }}
                    >
                        <p style={{ color: "#dc2626" }}>
                            {error}
                        </p>
                    </div>
                )}

                {message && (
                    <div
                        className="card"
                        style={{
                            borderLeft: "5px solid #22c55e",
                            marginBottom: "20px"
                        }}
                    >
                        <p style={{ color: "#16a34a" }}>
                            {message}
                        </p>
                    </div>
                )}

                {user && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "20px"
                        }}
                    >

                        <div className="card">

                            <h2>Account Details</h2>

                            <div
                                style={{
                                    marginTop: "20px"
                                }}
                            >
                                <p
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "13px"
                                    }}
                                >
                                    Name
                                </p>

                                <h3>
                                    {user.name}
                                </h3>
                            </div>

                            <div
                                style={{
                                    marginTop: "20px"
                                }}
                            >
                                <p
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "13px"
                                    }}
                                >
                                    Email
                                </p>

                                <h3>
                                    {user.email}
                                </h3>
                            </div>

                            <div
                                style={{
                                    marginTop: "20px"
                                }}
                            >
                                <p
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "13px"
                                    }}
                                >
                                    Account
                                </p>

                                <h3>
                                    DueEase Member
                                </h3>
                            </div>

                        </div>

                        <div className="card">

                            <h2>UPI Payment Details</h2>

                            <p
                                style={{
                                    color: "#6b7280",
                                    marginTop: "8px",
                                    marginBottom: "20px"
                                }}
                            >
                                Add your UPI ID so group members
                                can pay you directly through the
                                settlement QR code.
                            </p>

                            <form
                                onSubmit={handleSaveUPI}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px"
                                }}
                            >

                                <label>
                                    UPI ID
                                </label>

                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) =>
                                        setUpiId(e.target.value)
                                    }
                                    placeholder="example@upi"
                                />

                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        marginTop: "10px",
                                        border: "none",
                                        background: "#4f46e5",
                                        color: "white",
                                        padding: "11px 18px",
                                        borderRadius: "9px",
                                        fontWeight: "700",
                                        cursor: saving
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: saving
                                            ? 0.7
                                            : 1
                                    }}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save UPI ID"}
                                </button>

                            </form>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}

export default Profile;