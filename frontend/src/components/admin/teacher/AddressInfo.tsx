import React from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface AddressInfoProps {
  formData: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

const AddressInfo: React.FC<AddressInfoProps> = ({
  formData,
  errors,
  onChange,
}) => {
  const handleAddressChange = (field: string, value: string) => {
    onChange("address", {
      ...formData.address,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <Input
            value={formData.address.street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            placeholder="Enter street address"
            className={errors["address.street"] ? "border-red-500" : ""}
          />
          {errors["address.street"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["address.street"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Input
            value={formData.address.city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            placeholder="Enter city"
            className={errors["address.city"] ? "border-red-500" : ""}
          />
          {errors["address.city"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["address.city"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province
          </label>
          <Input
            value={formData.address.state}
            onChange={(e) => handleAddressChange("state", e.target.value)}
            placeholder="Enter state or province"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <Input
            value={formData.address.zipCode}
            onChange={(e) => handleAddressChange("zipCode", e.target.value)}
            placeholder="Enter ZIP code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <Input
            value={formData.address.country}
            onChange={(e) => handleAddressChange("country", e.target.value)}
            placeholder="Enter country"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressInfo;
