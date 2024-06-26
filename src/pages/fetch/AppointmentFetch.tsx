import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { Box, CardContent, IconButton, Tooltip } from "@mui/material";
import { DataGrid, GridCellParams, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArticleIcon from "@mui/icons-material/Article";
import DialogConfirm from "../../components/notification/DialogConfirm";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchAppointments, deleteAppointment } from "../../slices/appointmentSlice";
import { fetchPatients } from "../../slices/patientSlice";
import { AppDispatch } from "../../store";


type AppointmentFetchProps = {
    isExpanded: boolean;
    marginTop: number;
    onEdit: (appointmentData: FormData) => void;
    onView: (appointmentData: FormData) => void;
};

dayjs.extend(relativeTime);

const columns: GridColDef[] = [
    {
        field: 'patient',
        headerName: 'Patient',
        flex: 1,
        valueGetter: (params: GridValueGetterParams) => {
            const patientResponse = params.row.patientResponse;
            return patientResponse ? `${patientResponse.socialSecurity} | ${patientResponse.firstName} ${patientResponse.surname}` : 'Unknown';
        }
    },
    {
        field: 'schedule',
        headerName: 'Schedule',
        flex: 1,
        valueGetter: (params: GridValueGetterParams) => `${dayjs(params.row.schedule).format('YYYY-MM-DD HH:mm')} (${dayjs().to(params.row.schedule)})`,
        renderCell: (params: GridCellParams) => {
            const scheduleDate = dayjs(params.row.schedule);
            const now = dayjs();
            const differenceInMinutes = scheduleDate.diff(now, 'minute');

            let color = 'green';
            if (differenceInMinutes < 0) {
                color = 'red';
            } else if (differenceInMinutes <= 30) {
                color = 'orange';
            }

            return (
                <>
                    {dayjs(params.row.schedule).format('YYYY-MM-DD HH:mm')} 
                    <span style={{ color, marginLeft: '5px' }}>
                        ({dayjs().to(params.row.schedule)})
                    </span>
                </>
            );
        }
    },
    { field: 'description', headerName: 'Description', flex: 2, },
];

const AppointmentFetch: React.FC<AppointmentFetchProps> = ({ isExpanded, marginTop, onEdit, onView }) => {

    const dispatch: AppDispatch = useAppDispatch();

    // Fetch appointments when the component mounts
    useEffect(() => {
        dispatch(fetchAppointments());
        dispatch(fetchPatients());
    }, [dispatch]);

    const appointmentsData = useAppSelector((state) => state.appointment.appointments);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

    // Adicione este estado ao componente Appointment
    const [selectedRows, setSelectedRows] = useState<any[]>([]);

    // Estado para controlar a habilitação dos botões quando so 1 esta selecionado
    const [oneButtonsDisabled, setOneButtonsDisabled] = useState<boolean>(true);

    // Estado para controlar a habilitação dos botões quando mais de um esta selecionado
    const [multiButtonsDisabled, setMultiButtonsDisabled] = useState<boolean>(true);

    //funcao para apagar linha selecionada
    const handleDelete = (selectedRows: any[]) => {
        console.log('Deleting row with ID/s:', selectedRows);
        setConfirmDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedRows.length > 0) {
            selectedRows.forEach(rowId => {
                dispatch(deleteAppointment(rowId));
            });
        }
        setConfirmDialogOpen(false);
    };

    const handleEdit = (selectedRows: any[]) => {
        const selectedAppointment = appointmentsData.find(appointment => appointment.id === selectedRows[0]);

        if (selectedAppointment) {
            // Converta o objeto Appointment para FormData
            const formData = new FormData();
            if (selectedAppointment.id !== undefined) {
                formData.append('id', selectedAppointment.id.toString());
            }
            formData.append('description', selectedAppointment.description);
            formData.append('schedule', selectedAppointment.schedule);

            if (selectedAppointment.patientResponse) {
                formData.append('patientResponse', JSON.stringify(selectedAppointment.patientResponse));
            } else {
                // Faça algo se a propriedade patient estiver ausente
                console.log("Patient data not found");
            }
            onEdit(formData);
        }
    };


    //funcao para editar linha selecionada
    const handleDetails = (selectedRows: any[]) => {
        const selectedAppointment = appointmentsData.find(appointment => appointment.id === selectedRows[0]);
        if (selectedAppointment) {
            // Converta o objeto Appointment para FormData
            const formData = new FormData();
            if (selectedAppointment.id !== undefined) {
                formData.append('id', selectedAppointment.id.toString());
            }
            formData.append('description', selectedAppointment.description);
            formData.append('schedule', selectedAppointment.schedule);

            if (selectedAppointment.patientResponse) {
                formData.append('patientResponse', JSON.stringify(selectedAppointment.patientResponse));
            } else {
                // Faça algo se a propriedade patient estiver ausente
                console.log("Patient data not found");
            }
            onView(formData);
        }
    };


    // Função para lidar com a seleção de linhas
    const handleRowSelection = (newSelection: any[]) => {
        setSelectedRows(newSelection);

        // Habilitar/desabilitar botões com base no número de linhas selecionadas
        setOneButtonsDisabled(newSelection.length !== 1);

        // Habilitar/desabilitar botões com base no número de linhas selecionadas
        setMultiButtonsDisabled(newSelection.length < 1);
    };

    return (
        <Box>
            {/* Cabeçalho Personalizado */}
            <Box
                sx={{
                    backgroundColor: 'none',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'left',
                    color: '#000',
                    marginLeft: 2,
                    marginRight: 2,
                    marginTop: marginTop + 5,
                    transition: 'margin-top 0.5s ease',
                }}
                className={isExpanded ? 'disabled' : ''}
            >
                <Tooltip title="View" placement="top">
                    <span>
                        <IconButton onClick={() => handleDetails(selectedRows)} disabled={oneButtonsDisabled} color="inherit" size="small" sx={{ marginRight: 2 }}>
                            <ArticleIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Edit" placement="top">
                    <span>
                        <IconButton onClick={() => handleEdit(selectedRows)} disabled={oneButtonsDisabled} color="inherit" size="small" sx={{ marginRight: 2 }}>
                            <EditIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Delete" placement="top">
                    <span>
                        <IconButton onClick={() => handleDelete(selectedRows)} disabled={multiButtonsDisabled} color="error" size="small" sx={{ marginRight: 2 }}>
                            <DeleteIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            {/* Fim do Cabeçalho Personalizado */}
            <CardContent
                sx={{ marginTop: 0 }}
                className={isExpanded ? 'disabled' : ''}
            >
                <DataGrid
                    rows={appointmentsData}
                    columns={columns}
                    getRowId={(row) => row.id}
                    onRowSelectionModelChange={handleRowSelection}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 25 },
                        },
                    }}
                    pageSizeOptions={[25, 50]}
                    checkboxSelection
                    sx={{
                        '& .MuiDataGrid-cell': {
                            cursor: 'pointer',
                        },
                        '& .MuiDataGrid-row': {
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(25, 118, 210, 0.12) !important',
                            },
                        },
                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                            outline: 'none',
                        },
                    }}
                />
            </CardContent>
            <DialogConfirm
                open={confirmDialogOpen}
                title="Confirm Delete"
                message="Are you sure you want to delete the selected appointments?"
                severity="error"
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default AppointmentFetch;