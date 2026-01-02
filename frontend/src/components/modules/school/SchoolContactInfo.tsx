import React from "react";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { School } from "./types";

interface SchoolContactInfoProps {
  school: School;
}

const SchoolContactInfo: React.FC<SchoolContactInfoProps> = ({ school }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-gray-900">{school.address.street}</p>
            <p className="text-gray-900">
              {school.address.city}, {school.address.state}{" "}
              {school.address.postalCode}
            </p>
            <p className="text-gray-900">{school.address.country}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{school.contact.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{school.contact.email}</span>
          </div>
          {school.contact.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <a
                href={school.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {school.contact.website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolContactInfo;
