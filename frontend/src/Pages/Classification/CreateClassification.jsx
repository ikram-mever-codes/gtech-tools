import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusCircle,
  X,
  Save,
  ArrowLeft,
  Loader2,
  Settings,
  Ruler,
} from "lucide-react";
import {
  createClassification,
  getSingleClassification,
  updateClassification,
} from "../../apis/classifications";
import axios from "axios";
import { BASE_URL } from "../../assets/constants";

const AutoComplete = ({ results, setResults, setParent }) => {
  return (
    <div className="autocompelte-box">
      {results.map((result) => {
        return (
          <div
            className="autocompelte-result"
            key={result.parent_id_de}
            onClick={() => {
              setResults([]);
              setParent(result.parent_name_en);
            }}
          >
            {result.parent_name_en}
          </div>
        );
      })}
    </div>
  );
};

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
  const [showModModal, setShowModModal] = useState(false);
  const [showDimModal, setShowDimModal] = useState(false);
  const [currentSubClassIndex, setCurrentSubClassIndex] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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
            attributeModifications: sc.attributeModifications
              ? typeof sc.attributeModifications === "string"
                ? JSON.parse(sc.attributeModifications)
                : sc.attributeModifications
              : null,
            dimensionOperations: sc.dimensionOperations
              ? typeof sc.dimensionOperations === "string"
                ? JSON.parse(sc.dimensionOperations)
                : sc.dimensionOperations
              : {
                  weight: "",
                  height: "",
                  length: "",
                  width: "",
                },
            parent: sc.parent || "",
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

  const searchProducts = async (en_name) => {
    try {
      let res = await axios.get(
        `${BASE_URL}/search?en_name=${encodeURIComponent(en_name)}`,
        {
          headers: {
            "Content-Type": "application_json",
          },
          withCredentials: true,
        }
      );
      setSearchResults(res.data);
    } catch (error) {
      console.log(error.message);
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

  const handleParentSearch = async (index, value) => {
    const updatedSubClasses = [...classification.subClasses];
    updatedSubClasses[index] = {
      ...updatedSubClasses[index],
      parent: value,
    };
    setClassification({
      ...classification,
      subClasses: updatedSubClasses,
    });

    setSearchQuery(value);
    if (value.length > 2) {
      await searchProducts(value);
    } else {
      setSearchResults([]);
    }
  };

  const handleModificationsChange = (index, modifications) => {
    const updatedSubClasses = [...classification.subClasses];
    updatedSubClasses[index] = {
      ...updatedSubClasses[index],
      attributeModifications: modifications,
    };
    setClassification({
      ...classification,
      subClasses: updatedSubClasses,
    });
  };

  const handleDimensionOperationsChange = (index, operations) => {
    const updatedSubClasses = [...classification.subClasses];
    updatedSubClasses[index] = {
      ...updatedSubClasses[index],
      dimensionOperations: operations,
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
        {
          name: "",
          description: "",
          numberOfAttributes: 0,
          attributeModifications: null,
          dimensionOperations: {
            weight: "",
            height: "",
            length: "",
            width: "",
          },
          parent: "",
        },
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

  const openModificationsModal = (index) => {
    setCurrentSubClassIndex(index);
    setShowModModal(true);
  };

  const openDimensionsModal = (index) => {
    setCurrentSubClassIndex(index);
    setShowDimModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...classification,
        subClasses: classification.subClasses.map((sc) => ({
          ...sc,
          attributeModifications: sc.attributeModifications
            ? sc.attributeModifications
            : null,
          dimensionOperations: sc.dimensionOperations
            ? sc.dimensionOperations
            : null,
        })),
      };

      if (id) {
        await updateClassification(id, dataToSubmit);
      } else {
        await createClassification(dataToSubmit);
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
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => openModificationsModal(index)}
                        className="p-1 hover:bg-blue-50 rounded-full text-blue-500 transition-colors"
                        title="Attribute Modifications"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDimensionsModal(index)}
                        className="p-1 hover:bg-green-50 rounded-full text-green-500 transition-colors"
                        title="Dimension Operations"
                      >
                        <Ruler className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSubClass(index)}
                        className="p-1 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
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
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent
                        </label>
                        <input
                          type="text"
                          value={subClass.parent}
                          onChange={(e) =>
                            handleParentSearch(index, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Search for parent sub-class"
                        />
                        {searchResults.length > 0 && subClass.parent !== "" && (
                          <AutoComplete
                            results={searchResults}
                            setParent={(value) => {
                              handleSubClassChange(index, "parent", value);
                              setSearchResults([]);
                            }}
                            setResults={setSearchResults}
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
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

      {/* Attribute Modifications Modal */}
      {showModModal && currentSubClassIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-h-[90vh] overflow-y-scroll max-w-4xl rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Attribute Modifications for{" "}
                {classification.subClasses[currentSubClassIndex]?.name ||
                  `Sub-Class ${currentSubClassIndex + 1}`}
              </h3>
              <button
                onClick={() => setShowModModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Attributes1", "Attributes2", "Attributes3"].map((attr) => (
                  <div key={attr} className="border p-4 rounded-lg">
                    <h4 className="font-medium mb-3">{attr}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Prefix
                        </label>
                        <input
                          type="text"
                          value={
                            classification.subClasses[currentSubClassIndex]
                              ?.attributeModifications?.[attr]?.prefix || ""
                          }
                          onChange={(e) => {
                            const mods = {
                              ...(classification.subClasses[
                                currentSubClassIndex
                              ]?.attributeModifications || {}),
                              [attr]: {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications?.[attr] || {}),
                                prefix: e.target.value,
                              },
                            };
                            handleModificationsChange(
                              currentSubClassIndex,
                              mods
                            );
                          }}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Suffix
                        </label>
                        <input
                          type="text"
                          value={
                            classification.subClasses[currentSubClassIndex]
                              ?.attributeModifications?.[attr]?.suffix || ""
                          }
                          onChange={(e) => {
                            const mods = {
                              ...(classification.subClasses[
                                currentSubClassIndex
                              ]?.attributeModifications || {}),
                              [attr]: {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications?.[attr] || {}),
                                suffix: e.target.value,
                              },
                            };
                            handleModificationsChange(
                              currentSubClassIndex,
                              mods
                            );
                          }}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Remove Text
                        </label>
                        <input
                          type="text"
                          value={
                            classification.subClasses[currentSubClassIndex]
                              ?.attributeModifications?.[attr]?.remove || ""
                          }
                          onChange={(e) => {
                            const mods = {
                              ...(classification.subClasses[
                                currentSubClassIndex
                              ]?.attributeModifications || {}),
                              [attr]: {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications?.[attr] || {}),
                                remove: e.target.value,
                              },
                            };
                            handleModificationsChange(
                              currentSubClassIndex,
                              mods
                            );
                          }}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Find & Replace
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Find"
                            value={
                              classification.subClasses[currentSubClassIndex]
                                ?.attributeModifications?.[attr]?.find || ""
                            }
                            onChange={(e) => {
                              const mods = {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications || {}),
                                [attr]: {
                                  ...(classification.subClasses[
                                    currentSubClassIndex
                                  ]?.attributeModifications?.[attr] || {}),
                                  find: e.target.value,
                                },
                              };
                              handleModificationsChange(
                                currentSubClassIndex,
                                mods
                              );
                            }}
                            className="w-full px-3 py-2 border rounded"
                          />
                          <input
                            type="text"
                            placeholder="Replace"
                            value={
                              classification.subClasses[currentSubClassIndex]
                                ?.attributeModifications?.[attr]?.replace || ""
                            }
                            onChange={(e) => {
                              const mods = {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications || {}),
                                [attr]: {
                                  ...(classification.subClasses[
                                    currentSubClassIndex
                                  ]?.attributeModifications?.[attr] || {}),
                                  replace: e.target.value,
                                },
                              };
                              handleModificationsChange(
                                currentSubClassIndex,
                                mods
                              );
                            }}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Formula (use 'x' for value)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., x*2"
                          value={
                            classification.subClasses[currentSubClassIndex]
                              ?.attributeModifications?.[attr]?.formula || ""
                          }
                          onChange={(e) => {
                            const mods = {
                              ...(classification.subClasses[
                                currentSubClassIndex
                              ]?.attributeModifications || {}),
                              [attr]: {
                                ...(classification.subClasses[
                                  currentSubClassIndex
                                ]?.attributeModifications?.[attr] || {}),
                                formula: e.target.value,
                              },
                            };
                            handleModificationsChange(
                              currentSubClassIndex,
                              mods
                            );
                          }}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={() => setShowModModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowModModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Save Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dimension Operations Modal */}
      {showDimModal && currentSubClassIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-h-[90vh] overflow-y-scroll max-w-2xl rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Dimension Operations for{" "}
                {classification.subClasses[currentSubClassIndex]?.name ||
                  `Sub-Class ${currentSubClassIndex + 1}`}
              </h3>
              <button
                onClick={() => setShowDimModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {classification.subClasses[currentSubClassIndex]
                ?.dimensionOperations &&
                Object.entries(
                  classification.subClasses[currentSubClassIndex]
                    .dimensionOperations
                ).map(([dimension, operation]) => (
                  <div key={dimension} className="border p-4 rounded-lg">
                    <h4 className="font-medium mb-3">
                      {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                    </h4>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Operation (use 'x' for current value, 'attr1', 'attr2',
                        'attr3' for attributes)
                      </label>
                      <input
                        type="text"
                        value={operation}
                        onChange={(e) => {
                          const ops = {
                            ...(classification.subClasses[currentSubClassIndex]
                              ?.dimensionOperations || {}),
                            [dimension]: e.target.value,
                          };
                          handleDimensionOperationsChange(
                            currentSubClassIndex,
                            ops
                          );
                        }}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="e.g., x * 2, x + attr1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example formulas: "x * 2", "x + 5", "x * attr1", "(x +
                        attr2) / 2"
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={() => setShowDimModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDimModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Save Operations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateClassification;
