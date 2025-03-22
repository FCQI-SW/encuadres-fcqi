function AvanceMateria({
    params,
}: {
    params: { clave: string };
}) {
    //Una vez conectada a la BD, utilizar la clave para conseguir el registro con la información completa de la materia
    return (<>
        <h1>Materia con clave: {params.clave} </h1>
    </>)
}

export default AvanceMateria;