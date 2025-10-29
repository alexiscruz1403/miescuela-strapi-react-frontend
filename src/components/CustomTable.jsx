import { useState, useEffect, useRef } from "react";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TextField,
    Button,
    Box,
    Select,
    MenuItem,
    Typography
} from "@mui/material";
import { Confirm } from "react-admin";
import { Save, Edit, Add, Delete, WarningAmberRounded, Check } from "@mui/icons-material";

export const CustomTable = ({ headers, dataArray, keys, onSave, onError, editable = false }) =>{
    const [data, setData] = useState(JSON.parse(JSON.stringify(dataArray)));
    const [editingRows, setEditingRows] = useState([]);
    const [tempRowsValues, setTempRowsValues] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: "",
        content: "",
        confirmLabel: "",
        onConfirm: null,
        onCancel: null
    });

    const rowRefs = useRef({});

    const mappedHeaders = editable ? [...headers, { label: "Acciones" }] : headers;

    useEffect(() => {
        setHasChanges(false);
        keys.forEach(key => {
            if(data.length > dataArray.length || data.length < dataArray.length || data.some((item, index) => item[key.key] !== dataArray[index][key.key])) {
                setHasChanges(true);
                return;
            }
        })
    }, [data, dataArray, keys]);

    const handleEditRow = (rowIndex, disabled) => {
        if(disabled) return;

        if(editingRows && editingRows.includes(rowIndex)){
            const updatedData = [...data];
            updatedData[rowIndex] = { ...updatedData[rowIndex], ...tempRowsValues[rowIndex] };
            setData(updatedData);
            setEditingRows(prev => prev.filter(r => r !== rowIndex));
            setTempRowsValues(prev => {
                const updatedTemp = { ...prev };
                delete updatedTemp[rowIndex];
                return updatedTemp;
            });
        }else{
            setEditingRows(prev => {
                if(prev.includes(rowIndex)) return prev.filter(r => r !== rowIndex);
                return [...prev, rowIndex];
            } );
            setTempRowsValues(prev => ({
                ...prev,
                [rowIndex]: { ...data[rowIndex] },
            }));
        }
    }

    const handleChange = (value, rowIndex, key) => {
        setTempRowsValues(prev => ({
            ...prev,
            [rowIndex]: {
                ...prev[rowIndex],
                [key]: value
            }
        }));
    }

    const handleNotSavedChangesAdvice = () => {
        if(tempRowsValues && Object.keys(tempRowsValues).length === 0){
            handleSave();
            return;
        }

        setConfirmModal({
            open: true,
            title: "Confirmar guardado",
            content: "Hay cambios sin guardar. ¿Desea continuar sin guardarlos?",
            confirmLabel: "Guardar",
            onConfirm: handleSave,
            onCancel: closeConfirmModal
        });
    }

    const handleSave = () => {
        const rowsUnsaved = Object.keys(tempRowsValues);
        const filteredData = data.map((item, index) => {
            if(rowsUnsaved.includes(index.toString())){
                return null;
            }
            return item;
        }).filter(item => item !== null);

        const updatedRows = filteredData.map((item) => {
            if(item.id){
                const change = keys.some((key) => {
                    const originalItem = dataArray.find(d => d.id === item.id);
                    if(!originalItem) return false;
                    return originalItem[key.key] !== item[key.key];
                })

                if(change) return item;
                return null;
            }else{
                return null;
            }
        }).filter(item => item !== null);

        if(!validateRequiredFields(updatedRows)) return;

        if(updatedRows.length > 0){
            updatedRows.map(row => {
                keys.forEach(key => {
                    if(key.type === "select" && key.options){
                        const selectedOption = key.options.find(option => option.label === row[key.key]);
                        if(selectedOption) row[key.key] = selectedOption.id;
                    }
                });
            })
        }

        const newAddedRows = filteredData.filter(item => !item.id);

        if(!validateRequiredFields(newAddedRows)) return;
        
        if(newAddedRows.length > 0) {
            newAddedRows.map(row => {
                keys.forEach(key => {
                    if(key.type === "select" && key.options){
                        const selectedOption = key.options.find(option => option.label === row[key.key]);
                        if(selectedOption) row[key.key] = selectedOption.id;
                    }
                });
            })
        }

        onSave(updatedRows, newAddedRows);
        setHasChanges(false);
    }

    const handleAddRow = () => {
        const newRow = {};
        keys.forEach((key) => (newRow[key.key] = key.default ? key.default : ""));
        newRow.added = true;
        setData([...data, newRow]);
        setHasChanges(true);
        handleEditRow(data.length);
    };

    const handleError = (rowIndex, key, message) => {
        const ref = rowRefs.current[rowIndex];
        if(ref && ref.scrollIntoView) {
            ref.scrollIntoView({ behavior: "smooth", block: "center" });
            ref.classList.add("row-error-pulse");
            setTimeout(() => ref.classList.remove("row-error-pulse"), 3000);
        }
        onError(message);
    }

    const closeConfirmModal = () => {
        setConfirmModal({
            open: false,
            title: "",
            content: "",
            onConfirm: null,
            onCancel: null
        });
    }

    const handleDeleteAdvice = (rowIndex) => {
        setConfirmModal({
            open: true,
            title: "Confirmar eliminación",
            content: "¿Está seguro que quiere eliminar este registro? La acción no se puede deshacer",
            confirmLabel: "Eliminar",
            onConfirm: () => handleDeleteRow(rowIndex),
            onCancel: closeConfirmModal
        });
    }

    const handleDeleteRow = (rowIndex) => {
        const updated = [...data];
        updated.splice(rowIndex, 1);
        setData(updated);
        if(editingRows.includes(rowIndex)) setEditingRows(prev => prev.filter(r => r !== rowIndex));
        if(tempRowsValues[rowIndex]) {
            setTempRowsValues(prev => {
                const updatedTemp = { ...prev };
                delete updatedTemp[rowIndex];
                return updatedTemp;
            });
        }
        closeConfirmModal();
    }

    const validateRequiredFields = (rows) => {
        for (let row of rows) {
            for (let key of keys) {
                if (key.required && key.type === "text" && (!row[key.key] || row[key.key].toString().trim() === "")) {
                    handleError(data.indexOf(row), key.key, `El campo "${key.key}" es obligatorio.`);
                    return false;
                }

                if(key.required && key.type === "number") {
                    const value = parseFloat(row[key.key]);

                    if(isNaN(value)) {
                        handleError(data.indexOf(row), key.key, `El campo "${key.key}" es obligatorio y debe ser un número.`);
                        return false;
                    }
                    if(value < 1 || value > 10) {
                        handleError(data.indexOf(row), key.key, `El campo "${key.key}" debe estar entre 1 y 10.`);
                        return false;
                    }
                }

                if(key.type === "select" && key.options){
                    const isValidOption = key.options.some(option => option.label === row[key.key]);
                    if(!isValidOption){
                        handleError(data.indexOf(row), key.key, `El valor seleccionado en el campo "${key.key}" no es válido.`);
                        console.log("Validation failed for row:", row, "on key:", key.key);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    if(data.length === 0 && !editable) return null;

    return (
        <Box sx={{ overflowX: "auto" }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow >
                        {mappedHeaders.map((header, index) => (
                            <TableCell key={index} align="center" sx={{backgroundColor: "#D9E2EF"}}>
                                {header.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow 
                            key={index}
                            ref={el => rowRefs.current[index] = el}
                        >
                            {keys.map((key) => (
                                <TableCell 
                                    key={key.key} 
                                    align="center" 
                                    onKeyDown={(e) => {
                                        if(e.key === "Enter" && editingRows.includes(index)){
                                            handleEditRow(index);
                                        }
                                    }}
                                    sx={{ px: 1, py: 2 }}
                                >
                                    {editingRows.includes(index) && key.editable && key.type !== "select" ? 
                                    (
                                        <TextField
                                            value={tempRowsValues[index][key.key] || key.default}
                                            type={key.type || "text"}
                                            variant="standard"
                                            size="small"
                                            onChange={(e) => handleChange(e.target.value ,index, key.key)}
                                            autoFocus
                                        />
                                    ) : (editingRows.includes(index) && key.editable) || (editingRows.includes(index) && key.creatable && index >= dataArray.length) && key.type === "select" ? 
                                    (
                                        <Select
                                            value={tempRowsValues[index][key.key] || key.default}
                                            variant="standard"
                                            size="small"
                                            onChange={(e) => handleChange(e.target.value , index, key.key)}
                                            autoFocus
                                        >
                                            {key.options.map((option) => (
                                                <MenuItem key={option.id} value={option.label}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    ) : key.key === "editable" && !editingRows.includes(index) ? (
                                        <>
                                            <Edit 
                                                color={item.publicado ? "disabled" : "primary"}
                                                onClick={() => handleEditRow(index, item.publicado)}
                                                sx={{cursor: "pointer"}}
                                            />
                                            {item.added &&
                                                <Delete 
                                                    sx={{cursor: "pointer", marginLeft: 1}}
                                                    onClick={() => handleDeleteAdvice(data.indexOf(item))}
                                                />
                                            }
                                        </>
                                    ) : key.key === "editable" && editingRows.includes(index) ? 
                                    (
                                        <>
                                        <Check 
                                            color="success" 
                                            onClick={() => handleEditRow(index)}
                                            sx={{cursor: "pointer"}}
                                        />
                                        {item.added &&
                                            <Delete 
                                                sx={{cursor: "pointer", marginLeft: 1}}
                                                onClick={() => handleDeleteAdvice(index)}
                                            />
                                        }
                                        </>
                                    ): (
                                        item[key.key]
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {editable && 
                <Box 
                    onClick={handleAddRow} 
                    sx={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        mt: 1, 
                        cursor: "pointer", 
                        color: "#1976d2", 
                        backgroundColor: "#D9E2EF", 
                        paddingTop: 1, 
                        paddingBottom: 1, 
                        width: "100%"
                    }}
                >
                    <Add />
                </Box>
            }
            {hasChanges &&
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    sx={{mt: 2}}
                    onClick={handleNotSavedChangesAdvice}
                >
                    Guardar Cambios
                </Button>
            }
            <Confirm
                isOpen={confirmModal.open}
                title={
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <WarningAmberRounded sx={{ color: "#D32F2F", fontSize: 48 }} />
                    <Typography variant="h6" fontWeight="bold">
                        {confirmModal.title}
                    </Typography>
                    </Box>
                }
                content={
                    <Box sx={{ mt: 1 }}>
                    <Typography>
                        {confirmModal.content}
                    </Typography>
                    </Box>
                }
                confirm={confirmModal.confirmLabel || "Confirmar"}
                cancel="Cancelar"
                onConfirm={confirmModal.onConfirm}
                onClose={confirmModal.onCancel}
                sx={{
                    "& .RaConfirm-confirmButton": {
                    backgroundColor: "#D32F2F",
                    color: "#fff",
                    "&:hover": { backgroundColor: "#B71C1C" },
                    },
                }}
                />
        </Box>
    );
};