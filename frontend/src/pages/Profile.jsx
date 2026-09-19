import { useEffect, useState } from "react";
import Navbar from "../Navbar";
import API_BASE_URL from "../config";

function Profile() {
    const [user, setUser] = useState(null);

    const [name, setName] = useState("");
    const [upiId, setUpiId] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(true);
    const [savingName, setSavingName] = useState(false);
    const [savingUPI, setSavingUPI] = useState(false);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/api/auth/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setName(data.user.name || "");
                setUpiId(data.user.upiId || "");
            } else {
                setError(
                    data.message ||
                    "Failed to load profile"
                );
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

    // ==================== UPDATE NAME ====================

    const handleSaveName = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        try {
            setSavingName(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/api/auth/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setName(data.user.name || "");

                setMessage(
                    "Profile updated successfully!"
                );
            } else {
                setError(
                    data.message ||
                    "Failed to update profile"
                );
            }
        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setSavingName(false);
        }
    };

    // ==================== UPDATE UPI ====================

    const handleSaveUPI = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!upiId.trim()) {
            setError("Please enter your UPI ID");
            return;
        }

        try {
            setSavingUPI(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/api/auth/upi`,
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

                setMessage(
                    "UPI ID updated successfully!"
                );
            } else {
                setError(
                    data.message ||
                    "Failed to update UPI ID"
                );
            }
        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setSavingUPI(false);
        }
    };

    // ==================== LOADING ====================

    if (loading) {
        return (
            <div className="app">

                <Navbar />

                <div className="container">

                    <div className="card">
                        <p>
                            Loading profile...
                        </p>
                    </div>

                </div>

            </div>
        );
    }

    // ==================== UI ====================

    return (
        <div className="app">

            <Navbar />

            <div className="container">

                <div className="page-header">

                    <div>

                        <h1>
                            My Profile
                        </h1>

                        <p>
                            Manage your DueEase account
                            and payment details.
                        </p>

                    </div>

                </div>

                {/* ==================== MESSAGES ==================== */}

                {error && (
                    <div
                        className="card"
                        style={{
                            borderLeft:
                                "5px solid #ef4444",
                            marginBottom:
                                "20px"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#dc2626"
                            }}
                        >
                            {error}
                        </p>

                    </div>
                )}

                {message && (
                    <div
                        className="card"
                        style={{
                            borderLeft:
                                "5px solid #22c55e",
                            marginBottom:
                                "20px"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#16a34a"
                            }}
                        >
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

                        {/* ==================== ACCOUNT DETAILS ==================== */}

                        <div className="card">

                            <h2>
                                Account Details
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#6b7280",
                                    marginTop:
                                        "8px",
                                    marginBottom:
                                        "20px"
                                }}
                            >
                                Update your personal
                                account information.
                            </p>

                            <form
                                onSubmit={
                                    handleSaveName
                                }
                                style={{
                                    display:
                                        "flex",
                                    flexDirection:
                                        "column",
                                    gap: "10px"
                                }}
                            >

                                <label>
                                    Name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your name"
                                />

                                <label
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                >
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={
                                        user.email
                                    }
                                    disabled
                                    style={{
                                        background:
                                            "#f3f4f6",
                                        cursor:
                                            "not-allowed"
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        savingName
                                    }
                                    style={{
                                        marginTop:
                                            "10px",
                                        border:
                                            "none",
                                        background:
                                            "#4f46e5",
                                        color:
                                            "white",
                                        padding:
                                            "11px 18px",
                                        borderRadius:
                                            "9px",
                                        fontWeight:
                                            "700",
                                        cursor:
                                            savingName
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            savingName
                                                ? 0.7
                                                : 1
                                    }}
                                >
                                    {savingName
                                        ? "Saving..."
                                        : "Save Profile"}
                                </button>

                            </form>

                        </div>

                        {/* ==================== UPI DETAILS ==================== */}

                        <div className="card">

                            <h2>
                                UPI Payment Details
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#6b7280",
                                    marginTop:
                                        "8px",
                                    marginBottom:
                                        "20px"
                                }}
                            >
                                Add your UPI ID so group
                                members can pay you directly
                                through the settlement QR code.
                            </p>

                            <form
                                onSubmit={
                                    handleSaveUPI
                                }
                                style={{
                                    display:
                                        "flex",
                                    flexDirection:
                                        "column",
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
                                        setUpiId(
                                            e.target.value
                                        )
                                    }
                                    placeholder="example@upi"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        savingUPI
                                    }
                                    style={{
                                        marginTop:
                                            "10px",
                                        border:
                                            "none",
                                        background:
                                            "#4f46e5",
                                        color:
                                            "white",
                                        padding:
                                            "11px 18px",
                                        borderRadius:
                                            "9px",
                                        fontWeight:
                                            "700",
                                        cursor:
                                            savingUPI
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            savingUPI
                                                ? 0.7
                                                : 1
                                    }}
                                >
                                    {savingUPI
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