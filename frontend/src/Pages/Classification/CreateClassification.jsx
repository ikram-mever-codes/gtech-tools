import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PlusCircle, X, Save, ArrowLeft, Loader2 } from "lucide-react";
import {
  createClassification,
  getSingleClassification,
  updateClassification,
} from "../../apis/classifications";

const CreateClassification = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("classificationId");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [classification, setClassification] = useState({
    name: "",
    description: "",
    subClasses: [],
  });

  useEffect(() => {
    if (id) {
      fetchClassification();
    }
  }, [id]);

  const fetchClassification = async () => {
    setIsLoading(true);
    try {
      const result = await getSingleClassification(id);
      if (result?.success) {
        setClassification({
          ...result.data,
          subClasses: result.data.subClasses.map((sc) => ({
            ...sc,
            numberOfAttributes: sc.numberOfAttributes || 0,
          })),
        });
      } else {
        navigate("/classifications");
      }
    } catch (error) {
      console.error("Error fetching classification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setClassification({
      ...classification,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubClassChange = (index, field, value) => {
    const updatedSubClasses = [...classification.subClasses];
    updatedSubClasses[index] = {
      ...updatedSubClasses[index],
      [field]: field === "numberOfAttributes" ? parseInt(value) : value,
    };
    setClassification({
      ...classification,
      subClasses: updatedSubClasses,
    });
  };

  const addSubClass = () => {
    setClassification({
      ...classification,
      subClasses: [
        ...classification.subClasses,
        { name: "", description: "", numberOfAttributes: 0 },
      ],
    });
  };

  const removeSubClass = (index) => {
    const updatedSubClasses = classification.subClasses.filter(
      (_, i) => i !== index
    );
    setClassification({
      ...classification,
      subClasses: updatedSubClasses,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (id) {
        await updateClassification(id, classification);
      } else {
        await createClassification(classification);
      }
      navigate("/classifications");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading classification...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen my-[4rem] bg-gray-50 font-poppins">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/classifications")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">
                {id ? "Edit Classification" : "Create New Classification"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Classification Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={classification.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter classification name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={classification.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter classification description"
                />
              </div>
            </div>
          </div>

          {/* Sub-Classes Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  Sub-Classes
                </h2>
                <span className="text-sm text-gray-500">
                  ({classification.subClasses.length})
                </span>
              </div>
              <button
                type="button"
                onClick={addSubClass}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Sub-Class
              </button>
            </div>

            <div className="space-y-4">
              {classification.subClasses.map((subClass, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      Sub-Class {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeSubClass(index)}
                      className="p-1 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="text"
                      value={subClass.name}
                      onChange={(e) =>
                        handleSubClassChange(index, "name", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Sub-class name"
                      required
                    />
                    <textarea
                      value={subClass.description}
                      onChange={(e) =>
                        handleSubClassChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Sub-class description"
                      rows="2"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Attributes
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={subClass.numberOfAttributes}
                        onChange={(e) =>
                          handleSubClassChange(
                            index,
                            "numberOfAttributes",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter required number of attributes"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/classifications")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {!isLoading && <Save className="w-5 h-5 mr-2" />}
              {isLoading
                ? "Saving..."
                : id
                ? "Update Classification"
                : "Create Classification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassification;
