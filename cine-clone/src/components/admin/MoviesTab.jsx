import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  X,
  Eye,
  ChevronDown,
  Save,
  Filter,
  Plus,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 animate-fade-in-down">
    <AlertCircle size={12} /> {msg}
  </p>
);
