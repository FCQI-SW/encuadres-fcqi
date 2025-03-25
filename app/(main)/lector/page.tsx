"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function Lector() {
  const [roles, setRoles] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from("roles").select("*");
      if (error) console.error(error);
      else setRoles(data);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Roles</h1>
      <ul>
        {roles.map((user) => (
          <li key={user.id}>{user.nombre}</li>
        ))}
      </ul>
    </div>
  );
}

export default Lector;
