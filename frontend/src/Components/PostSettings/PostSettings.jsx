import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdDelete, MdEdit } from "react-icons/md";
import "./PostSettings.css";
import { BASE_URL } from "../../assets/constants";

const PostSettings = () => {
  const [constants, setConstants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", value: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseURL = `${BASE_URL}/api`;

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/constants/all`);
      if (Array.isArray(response.data)) {
        setConstants(response.data);
      } else {
        setConstants([]);
      }
    } catch (error) {
      console.error("Failed to fetch constants", error);
      toast.error("Failed to fetch constants!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.value) {
      return toast.error("Incomplete Fields");
    }
    if (/\s/.test(formData.name)) {
      toast.error("Name cannot contain spaces.");
      return;
    }
    formData.value = Number(formData.value);
    try {
      setLoading(true);
      await axios.post(`${baseURL}/constants/create`, formData);
      setFormData({ name: "", value: "" });
      setIsCreating(false);
      fetchConstants();
      toast.success("Constant created successfully!");
    } catch (error) {
      console.error("Failed to create constant", error);
      toast.error("Failed to create constant!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    if (/\s/.test(formData.name)) {
      toast.error("Name cannot contain spaces.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${baseURL}/constants/edit/${id}`, formData);
      setEditingId(null);
      setFormData({ name: "", value: "" });
      fetchConstants();
      toast.success("Constant updated successfully!");
    } catch (error) {
      console.error("Failed to edit constant", error);
      toast.error("Failed to edit constant!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${baseURL}/constants/delete/${id}`);
      fetchConstants();
      toast.success("Constant deleted successfully!");
    } catch (error) {
      console.error("Failed to delete constant", error);
      toast.error("Failed to delete constant!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="post-settings-container">
      <ToastContainer />
      <h2 className="post-settings-title">Manage Constants</h2>
      {!isCreating && (
        <button
          style={{ margin: "10px auto" }}
          onClick={() => setIsCreating(true)}
          className="add-new-button"
        >
          Add New Constant
        </button>
      )}
      {isCreating && (
        <div className="constant-create">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Constant Name"
          />
          <input
            type="text"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            placeholder="Constant Value"
          />
          <div
            style={{
              width: "100%",
              height: "max-content",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleCreate}
              disabled={loading}
              className="post-settings-button"
            >
              Create
            </button>
            <button
              className="post-settings-button"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading && <p className="loading-message">Loading constants...</p>}
      <div className="constant-table-wrapper">
        <table className="constants-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {constants.length === 0 && !loading ? (
              <tr>
                <td colSpan="3" className="alt-message">
                  No constants found. Please add some!
                </td>
              </tr>
            ) : (
              constants.map((constant) => (
                <tr key={constant.id}>
                  {editingId === constant.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Name"
                          className="post-settings-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="value"
                          value={formData.value}
                          onChange={handleInputChange}
                          className="post-settings-input"
                          placeholder="Value"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(constant.id)}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{constant.name}</td>
                      <td>{constant.value}</td>
                      <td>
                        <button
                          className="post-settings-button"
                          onClick={() => {
                            setEditingId(constant.id);
                            setFormData({
                              name: constant.name,
                              value: constant.value,
                            });
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <MdEdit
                            style={{ fontSize: "18px", color: "white" }}
                          />{" "}
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(constant.id)}
                          disabled={loading}
                          className="post-settings-button"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <MdDelete
                            style={{ fontSize: "18px", color: "white" }}
                          />{" "}
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PostSettings;
