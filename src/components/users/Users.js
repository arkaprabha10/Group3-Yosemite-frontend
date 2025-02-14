import React, { useState, useEffect, useCallback } from 'react';
import useTable from '../useTable';
import UserForm from './UserForm';
import Controls from '../controls/Controls';
import Popup from '../Popup';
import Notification from '../Notification';
import ConfirmDialog from '../ConfirmDialog';
import {
    Paper,
    makeStyles,
    TableBody,
    TableRow,
    TableCell,
    Toolbar,
    InputAdornment,
} from '@material-ui/core';
import Search from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import CloseIcon from '@material-ui/icons/Close';
import { UserService } from '../../services/apis.service';
import {
    userCellsAdmin,
    userCellsFaculty,
    userCellsStudent,
} from '../../services/tableHeadCells';
import Loding from '../Loding';

const useStyles = makeStyles((theme) => ({
    pageContent: {
        margin: theme.spacing(5),
        padding: theme.spacing(3),
    },
    searchInput: {
        width: '75%',
    },
    newButton: {
        position: 'absolute',
        right: '10px',
    },
}));

function Users(props) {
    const classes = useStyles();
    const { role, user } = props;

    // handle loding state
    const [loding, setLoading] = useState(true);

    // handling modal and notif bar
    const [openPopup, setOpenPopup] = useState(false);
    const [notify, setNotify] = useState({
        isOpen: false,
        message: '',
        type: '',
    });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        subTitle: '',
    });

    // fetching user data
    const [userList, setUserList] = useState([]);
    const fetchUserList = useCallback(async () => {
        if (role !== undefined) {
            console.log('role', role);
            if (role === 'faculty') {
                await UserService.getRoleUsers('student')
                    .then((response) => {
                        setUserList(response.data.users);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
            if (role === 'admin') {
                await UserService.getAllUsers()
                    .then((response) => {
                        setUserList(response.data.users);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        }
    }, [role]);
    useEffect(() => {
        fetchUserList();
    }, [fetchUserList, role]);

    // For table part
    const [filterFn, setFilterFn] = useState({
        fn: (items) => {
            return items;
        },
    });

    const headCells =
        user.role === 'admin'
            ? userCellsAdmin
            : user.role === 'faculty'
            ? userCellsFaculty
            : userCellsStudent;

    const {
        TblContainer,
        TblHead,
        TblPagination,
        recordsAfterPagingAndSorting,
    } = useTable(userList, headCells, filterFn);

    const handleSearch = (e) => {
        let target = e.target;
        setFilterFn({
            fn: (items) => {
                if (target.value === '') return items;
                else
                    return items.filter(
                        (x) =>
                            x.user_name.toLowerCase().includes(target.value) ||
                            x.email.toLowerCase().includes(target.value) ||
                            x.role.toLowerCase().includes(target.value)
                    );
            },
        });
    };

    const [recordForEdit, setRecordForEdit] = useState(null);

    const addOrEdit = async (user, resetForm) => {
        if (user.id === 0) {
            await UserService.createUser(user)
                .then((response) => {
                    setNotify({
                        isOpen: true,
                        message: `Created Successfully`,
                        type: 'success',
                    });
                    setLoading(true);
                    fetchUserList();
                })
                .catch((error) => {
                    setNotify({
                        isOpen: true,
                        message: 'Error to Create',
                        type: 'error',
                    });
                });
        } else {
            await UserService.updateUser(user._id, user)
                .then((response) => {
                    setNotify({
                        isOpen: true,
                        message: `Edited Successfully`,
                        type: 'success',
                    });
                    setLoading(true);
                    fetchUserList();
                })
                .catch((error) => {
                    setNotify({
                        isOpen: true,
                        message: 'Error to Edit',
                        type: 'error',
                    });
                });
        }
        resetForm();
        setRecordForEdit(null);
        setOpenPopup(false);
    };

    const openInPopup = (item) => {
        setRecordForEdit(item);
        setOpenPopup(true);
    };

    const onDelete = async (id) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: false,
        });

        await UserService.deleteUser(id)
            .then((response) => {
                setNotify({
                    isOpen: true,
                    message: 'Deleted Successfully',
                    type: 'success',
                });
                setLoading(false);
                fetchUserList();
            })
            .catch((error) => {
                setNotify({
                    isOpen: true,
                    message: 'Error to delete',
                    type: 'error',
                });
                console.log(error);
            });
    };

    return (
        <div>
            <Paper className={classes.pageContent}>
                <Toolbar>
                    <Controls.Input
                        label="Search Users"
                        className={classes.searchInput}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        onChange={handleSearch}
                    />
                    {role === 'admin' && (
                        <Controls.Button
                            text="Add New"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            className={classes.newButton}
                            onClick={() => {
                                setOpenPopup(true);
                                setRecordForEdit(null);
                            }}
                        />
                    )}
                </Toolbar>

                {loding ? (
                    <Loding />
                ) : (
                    <TblContainer>
                        <TblHead />
                        <TableBody>
                            {recordsAfterPagingAndSorting().map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>{item.user_name}</TableCell>
                                    <TableCell>{item.email}</TableCell>
                                    <TableCell>{item.role}</TableCell>
                                    {role === 'admin' && (
                                        <TableCell>
                                            <Controls.ActionButton
                                                color="primary"
                                                onClick={() => {
                                                    openInPopup(item);
                                                }}
                                            >
                                                <EditOutlinedIcon fontSize="small" />
                                            </Controls.ActionButton>
                                            <Controls.ActionButton
                                                color="secondary"
                                                onClick={() => {
                                                    setConfirmDialog({
                                                        isOpen: true,
                                                        title:
                                                            'Are you sure to delete this user?',
                                                        subTitle:
                                                            "You can't undo this operation",
                                                        onConfirm: () => {
                                                            onDelete(item._id);
                                                        },
                                                    });
                                                }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </Controls.ActionButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </TblContainer>
                )}
                <TblPagination />
            </Paper>
            <Popup
                title="User Form"
                openPopup={openPopup}
                setOpenPopup={setOpenPopup}
            >
                <UserForm recordForEdit={recordForEdit} addOrEdit={addOrEdit} />
            </Popup>
            <Notification notify={notify} setNotify={setNotify} />
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
            />
        </div>
    );
}

export default Users;
